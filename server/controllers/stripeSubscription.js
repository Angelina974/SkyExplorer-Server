/**
 * 
 * Stripe subscription controller:
 * - subscribe
 * - subscribeSuccess
 * - stripeCreatePortal
 * - getSubscriptionPlans
 * - stripeWebhooks
 * - subscribeError
 * - listInvoices
 * 
 */
const config = require("../config")
const stripe = require("stripe")(config.api.stripe.secret_key)
const authentication = require("./authentication")
const {
	API : {
		BadRequest,
        InternalServerError
	}
} = require('../core/errors')

const stripeController = {

    /**
     * Try to subscribe a new customer by redirecting on Stripe checkout page
     */
    subscribe: async (req, res) => {
        const token = authentication.getToken(req, res)
        if (!token) return

        let reqData = req.body
        const accountId = token.accountId

        // Get the customer Id from account
        let account = await kiss.db.findOne("account", {
            _id: accountId
        })

        let query = {
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [{
                price: reqData.planId,
                quantity: 1
            }],

            // {CHECKOUT_SESSION_ID} is a string literal do not change it!
            // the actual session id is returned in the query parameter when the customer is redirected to the success page
            success_url: "https://" + config.host + "/subscribeSuccess?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: "https://" + config.host + "/subscribeError",
        }

        if (account && account.stripeCustomerId !== "") {
            query.customer = account.stripeCustomerId
        }

        const session = await stripe.checkout.sessions.create(query)

        if (session && session.url && session.id) {
	        // Store the checkout session in the account for later use
			await  kiss.db.updateOne("account", {
				_id: accountId
			}, {
				session: session.id
			})

	        return res.status(200).send({
		        redirectURL: session.url
	        })
        } else {
            throw new BadRequest()
        }
    },

    /**
     * Subscription success
     */
    subscribeSuccess: async (req, res) => {
        try {
            // Retrieve the Stripe session data
            log("Retrieving the Stripe session data")
            log(req.queryStringObject)

            const session_id = req.queryStringObject.session_id
            const session = await stripe.checkout.sessions.retrieve(session_id)
            const subscription = await stripe.subscriptions.retrieve(session.subscription)

            // Retriveve the subscription item
            let planId
            let plan

            if (subscription && subscription.items) {
                planId = subscription.items.data[0].price.id

                const subscriptionPlans = await stripe.prices.list({
                    limit: 100,
                    expand: ["data.product"]
                })

                plan = subscriptionPlans.data.find(plan => plan.id == planId)
            } else {
                throw new BadRequest()
            }

            // Set the updates to operate on the account
            let accountData = {
                stripeCustomerId: session.customer,
                stripeSubscriptionId: session.subscription,
                planId,
                planUsers: plan.product.metadata.users,
                planApps: plan.product.metadata.apps,
                periodStart: new Date(subscription.current_period_start * 1000).toISOString(),
                periodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                updatedAt: new Date().toISOString(),
                status: "active"
            }

            // Get the account to update from the Stripe session id
            const account = await kiss.db.findOne("account", {
                session: session_id
            })

            // Update the plan data in the account
            if (account && account.id) {
                await kiss.db.updateOne("account", {
                    _id: account.id
                }, accountData)

                // Update the directory accounts cache
                kiss.directory.updateAccount(account.id, accountData)

                // Back to the home page
                let homeUrl = config.authentication.redirectTo.home
                homeUrl = homeUrl + "&uiAccount=account-properties&uiThanks=account-thanks"
                res.redirect(301, homeUrl)
            } else {
                throw new BadRequest()
            }
        }
        catch(err) {
            log("stripe.subscribeSuccess - Error: " + err)
            log("Session id was: " + req.queryStringObject.session_id)
            throw new InternalServerError()
        }
    },

    /**
     * Creates a temporary customer's portal
     */
    stripeCreatePortal: async (req, res) => {
        const token = authentication.getToken(req, res)
        if (!token) return

        // Get the customer Id from account
        const accountId = token.accountId
        let account = await kiss.db.findOne("account", {
            _id: accountId
        })

        let homeUrl = config.authentication.redirectTo.home
        homeUrl = "https://" + config.host + homeUrl + "&uiAccount=account-properties"

        const session = await stripe.billingPortal.sessions.create({
            customer: account.stripeCustomerId,
            return_url: homeUrl
        })

        res.status(200).send({
            portalUrl: session.url
        })
    },

    /**
     * Get active subscription plans
     */
    getSubscriptionPlans: async (req, res) => {
        const token = authentication.getToken(req, res)
        if (!token) return

        // Get all active price plan 
        let subscriptionPlans = await stripe.products.list({
            active: true,
            limit: 100,
            expand: ["data.default_price"]
        })

        res.status(200).send(subscriptionPlans.data)
    },

    /**
     * Stripe webhooks API endpoint
     * 
     * Listens to the following Stripe events:
     * - invoice.paid
     * - invoice.payment_failed
     * - customer.subscription.updated
     * - customer.subscription.deleted
     */
    stripeWebhooks: async (req, res) => {
        const handledEvents = ["invoice.paid", "invoice.payment_failed", "customer.subscription.updated", "customer.subscription.deleted"]

        let stripeEvent
        let eventType
        let eventData
        let eventObject
        let account
        let accountUpdate
        let payload = req.body

        // Check if webhook signing is configured
        // TODO: secret disabled at the moment because the rawBody seems to be altered while processing
        // const webhookSecret = config.api.stripe.webhook_secret
        const webhookSecret = null

        // Retrieve the event by verifying the signature using the raw body and secret
        if (webhookSecret) {
            const signature = req.headers["stripe-signature"]

            try {
                stripeEvent = stripe.webhooks.constructEvent(
                    req.rawBody,
                    signature,
                    webhookSecret
                )
            } catch (err) {
                log.err("stripe.webhook - Webhook signature verification failed", err)
                throw new BadRequest()
            }

            // Extract the object from the event
            eventType = stripeEvent.type
            eventData = stripeEvent.data
            eventObject = eventData.object
        } else {
            // Webhook signing is recommended, but if the secret is not configured,
            // retrieves the event data directly from the request payload.
            eventType = payload.type
            eventData = payload.data
            eventObject = eventData.object
        }

        log("stripe.webhook - Incoming event: " + eventType)
        
        // The event is not handled: exit!
        if (!handledEvents.includes(eventType)) {
            log.warn(`stripe.webhook - Unhandled webhook: ${eventType} - Terminating webhook`)
            return res.status(200).end()
        }

        // Get the customer account
        // Give time to Mongo to update its indexes before requesting the account
        log.info("stripe.webhook - Waiting for database to update its indexes...")
        await kiss.tools.wait(5000)
        
        account = await kiss.db.findOne("account", {
            stripeCustomerId: eventData.object.customer
        })

        // The account is not found: exit!
        if (!account) {
            log.err(`stripe.webhook - Account not found: ${eventData.object.customer} - Terminating webhook`)
            return res.status(200).end()
        }

		let planId,
			plan

        switch (eventType) {
            case "invoice.paid":
                // A payment is complete
                const paymentEvent = {
                    id: kiss.tools.uid(),
                    type: eventObject.object,
                    eventId: eventObject.id,
                    createdAt: new Date().toISOString(),
                    accountId: account.id,
                    customerId: eventObject.customer,
                    subscriptionId: eventObject.subscription,
                    invoiceId: eventObject.id,
                    invoiceUrl: eventObject.hosted_invoice_url,
                    invoicePdf: eventObject.invoice_pdf,
                    amount: eventObject.amount_paid,
                    currency: eventObject.currency,
                    periodStart: new Date(eventObject.period_start * 1000).toISOString(),
                    periodEnd: new Date(eventObject.period_end * 1000).toISOString(),
                    status: eventObject.status
                }

                await kiss.db.insertOne("paymentEvent", paymentEvent)
                log.ack("stripe.webhook - <invoice.paid> processed")
                break

            case "invoice.payment_failed":
                // A payment has failed
                await kiss.db.updateOne("account", {
                    _id: account.id
                }, {
                    status: "payment_failed"
                })

                // Update the directory accounts cache
                kiss.directory.updateAccount(account.id, accountUpdate)

                log.ack("stripe.webhook - <invoice.payment_failed> processed")
                break

            case "customer.subscription.updated":
                // A subscription has been updated from the customer's portal
                planId = eventObject.items.data[0].price.id
                const subscriptionPlans = await stripe.prices.list({
                    limit: 100,
                    expand: ["data.product"]
                })

                plan = subscriptionPlans.data.find(plan => plan.id == planId)

                accountUpdate = {
                    planId,
                    planUsers: Number(plan.product.metadata.users),
                    planApps: Number(plan.product.metadata.apps),
                    updatedAt: new Date(eventObject.created * 1000).toISOString(),
                    periodStart: new Date(eventObject.current_period_start * 1000).toISOString(),
                    periodEnd: new Date(eventObject.current_period_end * 1000).toISOString(),
                    status: eventObject.status
                }

                kiss.db.updateOne("account", {
                    _id: account.id
                }, accountUpdate)

                // Update the directory accounts cache
                kiss.directory.updateAccount(account.id, accountUpdate)
                
                log.ack("stripe.webhook - <customer.subscription.updated> processed")
                break

            case "customer.subscription.deleted":
                // A subscription has been canceled from the customer's portal
                accountUpdate = {
                    planId: "none",
                    planUsers: 0,
                    planApps: 0,
                    updatedAt: new Date().toISOString(),
                    periodStart: new Date(eventObject.current_period_start * 1000).toISOString(),
                    periodEnd: new Date(eventObject.current_period_end * 1000).toISOString(),
                    status: "canceled"
                }

                kiss.db.updateOne("account", {
                    _id: account.id
                }, accountUpdate)

                // Update the directory accounts cache
                kiss.directory.updateAccount(account.id, accountUpdate)
                
                log.ack("stripe.webhook - <customer.subscription.deleted> processed")
                break
        }

        // Acknowledge to Stripe server
        res.status(200).end()
    },

    /**
     * An error has occured: redirect back to the home page
     */
    subscribeError: (req, res) => {
        let homeUrl = config.authentication.redirectTo.home
        homeUrl = homeUrl + "&uiAccount=account-properties"
        res.redirect(302, homeUrl)
    },

    /**
     * List the invoices of the connected user.
     * Returns an empty list if:
     * - the user doesn't have any invoice yet (= no stripeCustomerId)
     * - the user is not the account owner
     */
    listInvoices: async(req, res) => {
        const token = authentication.getToken(req, res)
        if (!token) return
        
        const account = await kiss.db.findOne("account", {
            accountId: token.accountId
        })

        // Silently manage error cases
        const customer = account.stripeCustomerId
        if (!customer) return res.status(200).send({data: []})
        if (account.owner != token.userId) return res.status(200).send({data: []})

        const invoices = await stripe.invoices.list({ customer, limit: 100 })
        res.status(200).send(invoices)
    }
}

module.exports = stripeController
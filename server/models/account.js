kiss.app.defineModel({
    id: "account",
    name: "Account",
    namePlural: "Accounts",
    icon: "fas fa-home",
    color: "#00aaee",

    items: [{
            primary: true,
            id: "owner",
            dataType: String
        },
        {
            isACL: true,
            id: "managers",
            dataType: Array
        },
        {
            id: "planId",
            dataType: String
        },
        {
            id: "planUsers",
            dataType: String
        },
        {
            id: "planApps",
            dataType: String
        },
        {
            id: "stripeCustomerId",
            dataType: String
        },
        {
            id: "stripeSubscriptionId",
            dataType: String
        },
        {
            id: "periodStart",
            dataType: String
        },
        {
            id: "periodEnd",
            dataType: String
        },
        {
            id: "status",
            dataType: String
        },
        {
            id: "createdAt",
            dataType: String
        },
        {
            id: "collaborators",
            dataType: Array
        },
        {
            id: "invited",
            dataType: Array
        },
        {
            id: "smtp",
            dataType: Object
        }
    ],

    acl: {
        permissions: {
            create: [{
                isCreator: true
            }],
            update: [{
                isSupportTeam: true
            }],
            delete: [{
                isDeleter: true
            }]
        },

        validators: {
            async isCreator() {
                return false
            },
            
            async isSupportTeam({req, record}) {
                const userId = (kiss.isServer) ? req.token.userId : kiss.session.getUserId()
                if (userId.split("@")[1] === "pickaform.com") return true
                return false
            },

            async isDeleter() {
                return false
            }
        }
    },

    methods: {
        /**
         * Collect account stats / usage:
         * - users
         * - groups
         * - workspaces
         * - apps
         * - models
         * - views
         * - files
         * 
         * @returns {object}
         */
        async getStats() {
            const collections = kiss.app.collections
            await collections.file.find()
            await collections.view.find()

            let stats = {
                users: collections.user.records.length,
                groups: collections.group.records.length,
                workspaces: collections.workspace.records.length,
                applications: collections.application.records.length,
                models: collections.model.records.length,
                views: collections.view.records.length,
                files: collections.file.records.length
            }

            return stats
        },

        /**
         * Display the dialog to invite a new user,
         * if the quota of users is not exceeded.
         * Note: exclude @pickaform support users from the count
         */
        async inviteUser() {
            const currentNumberOfUsers = kiss.directory.users.filter(user => !user.email.includes("@pickaform.com")).length
            const allowedNumberOfUsers = Number(this.planUsers)

            if (currentNumberOfUsers >= allowedNumberOfUsers) {
                let message = txtTitleCase("#userQuota")
                if (kiss.session.isOwner) {
                    message += "<br>" + txtTitleCase("#appQuotaManagement")
                    message = message.replace("#account", `javascript:$('msg-quota').close(); kiss.views.show('account-properties')`)
                } else {
                    message += "<br>" + txtTitleCase("#tell owner")
                }

                createDialog({
                    id: "msg-quota",
                    title: txtTitleCase("invite a new user"),
                    icon: "fas fa-user-plus",
                    message,
                    noCancel: true
                })
            } else {
                kiss.views.show("authentication-invite")
            }
        },

        /**
         * Resend an invitation
         */
        async resendInvitation(email) {
            createDialog({
                title: txtTitleCase("resend the invitation"),
                icon: "far fa-envelope",
                message: txtTitleCase("#confirm invitation"),

                action: async () => {
                    const response = await kiss.ajax.request({
                        url: "/resendInvite",
                        method: "post",
                        showLoading: true,
                        body: JSON.stringify({
                            email: email,
                            language: kiss.language.current
                        })
                    })

                    if (response.error) {
                        createNotification({
                            message: txtTitleCase(response.error)
                        })
                    } else {
                        createNotification({
                            message: txtTitleCase("invitation sent for") + " " + email
                        })
                    }
                }
            })
        },

        /**
         * Delete an invitation
         */
        deleteInvitation(userId) {
            return new Promise((resolve, reject) => {
                createDialog({
                    title: txtTitleCase("delete the invitation"),
                    icon: "far fa-envelope",
                    message: txtTitleCase("#confirm delete invitation"),

                    action: async () => {
                        const response = await kiss.ajax.request({
                            url: "/deleteInvite/" + userId,
                            method: "delete"
                        })

                        if (response.error) {
                            createNotification({
                                message: txtTitleCase(response.error)
                            })

                            reject(response)
                        } else {

                            createNotification({
                                message: txtTitleCase("the invitation has been deleted")
                            })

                            resolve(response)
                        }
                    }
                })
            })
        },

        /**
         * Delete a user who has already joined
         */
        deleteUser(userId, userEmail) {
            return new Promise((resolve, reject) => {
                createDialog({
                    title: txtTitleCase("delete the user"),
                    icon: "far fa-user",
                    type: "input",
                    message: txtTitleCase("#confirm delete user"),
                    autoClose: false,
                    colorOK: "#ff0000",
                    buttonOKText: txtTitleCase("delete the user"),

                    action: async (validation) => {
                        if (validation != userEmail) {
                            createNotification(txtTitleCase("the email is not valid"))
                            return false
                        }

                        const response = await kiss.ajax.request({
                            url: "/deleteUser/" + userId,
                            method: "delete"
                        })

                        if (response.error) {
                            createNotification({
                                message: txtTitleCase(response.error)
                            })

                            reject(response)
                        } else {
                            createNotification({
                                message: txtTitleCase("the user has been deleted")
                            })

                            resolve(response)
                        }
                        return true
                    }
                })
            })
        },

        /**
         * Check if it's possible to create a new application for this account.
         * Sends a message if the quota is exceeded, otherwise, execute the callback to create the app.
         * 
         * @param {function} createAppCallback
         */
        async checkAppCreationQuotaThen(createAppCallback) {
            const currentNumberOfApps = kiss.app.collections.application.records.length
            const allowedNumberOfApps = Number(this.planApps)

            if (currentNumberOfApps >= allowedNumberOfApps) {
                let message = txtTitleCase("#appQuota")
                if (kiss.session.isOwner) {
                    message += "<br>" + txtTitleCase("#appQuotaManagement")
                    message = message.replace("#account", `javascript:$('msg-quota').close(); kiss.views.show('account-properties')`)
                } else {
                    message += "<br>" + txtTitleCase("#tell owner")
                }
                createDialog({
                    id: "msg-quota",
                    title: txtTitleCase("create an application"),
                    icon: "fas fa-th",
                    message,
                    noCancel: true
                })
            } else createAppCallback()
        },

        /**
         * Get the account status
         * 
         * @returns {boolean} true is the account is flagged "active", false otherwise
         */
        getStatus() {
            if (this.planId == "trial") {
                return !this.trialExpired()
            } else {
                const periodEnd = new Date(this.periodEnd)
                const today = new Date()
                return (this.status == "active" && periodEnd > today)
            }
        },

        /**
         * Check the account status, or a specific application status.
         * - if status not OK, displays a warning.
         * - if it's a demo, offline or in-memory context, exit
         * 
         * @param {string} [applicationId] - Optional application id if we need to check if the application is part of the active subscription
         */
        async checkStatus(applicationId) {
            if (kiss.global.mode == "demo" || kiss.global.mode == "offline" || kiss.global.mode == "memory") return

            // Account is not active
            if (!this.getStatus()) {
                return application.msg.featureLocked(txtTitleCase("inactive account"), txtTitleCase("#account locked"), false)
            }

            // Account is active: check if the user is an active user
            if (!this.isActiveUser(kiss.session.userId)) {
                return application.msg.featureLocked(txtTitleCase("inactive user"), `${txtTitleCase("#user locked")}`, false)
            }

            // User is OK: check application quotas
            if (applicationId) {
                const activeApplicationIds = await this.getActiveApplications()
                if (!activeApplicationIds.includes(applicationId)) {
                    application.msg.featureLocked(txtTitleCase("inactive application"), `${txtTitleCase("#application locked")}`, false)
                }
            }
        },

        /**
         * Get the list of active applications:
         * - applications not deleted
         * - applications not belonging to a deleted workspace
         * - applications included in the quota of the current subscription plan
         * - result is sorted by the application creation date
         * 
         * @async
         * @param {boolean} active 
         * @return {string[]} list of application ids
         */
        async getActiveApplications() {
            const workspaces = await kiss.app.collections.workspace.find()
            const workspaceIds = workspaces.map(workspace => workspace.id)
            let applications = await kiss.app.collections.application.find()
            applications = applications.filter(application => !application.deleted && workspaceIds.includes(application.workspaceId))
            let applicationIds = applications.sortBy("createdAt").map(application => application.id)
            applicationIds = applicationIds.slice(0, this.planApps)
            return applicationIds
        },

        /**
         * Get the list of active users:
         * - users included in the quota of the current subscription plan
         * - result is sorted by the user creation date
         * 
         * @return {string[]} list of active users
         */        
        getActiveUsers() {
            let activeUsers = Object.values(kiss.directory.users).sortBy("createdAt").map(user => user.email).splice(0, this.planUsers)
            let supportUsers = []
            kiss.directory.users.forEach(user => {
                if (user.email.includes("@pickaform.com")) {
                    supportUsers.push(user.email)
                }
            })
            return activeUsers.concat(supportUsers).unique()
        },

        /**
         * Check if a user is part of the active users (allowed by the current subscription plan)
         * 
         * @param {string} email
         * @return {boolean}
         */
        isActiveUser(email) {
            return this.getActiveUsers().includes(email)
        },

        /**
         * Get the list of active views:
         * - views not deleted
         * - views not belonging to deleted applications
         * 
         * @async
         * @returns {string[]} List of view ids
         */
        async getActiveViews() {
            const activeApplicationIds = await this.getActiveApplications()
            let views = await kiss.app.collections.view.find()
            views = views.filter(view => kiss.tools.intersects(view.applicationIds, activeApplicationIds))
            return views
        },

        /**
         * Get the list of active models
         * 
         * Active models are models belonging to an active view
         * 
         * @async
         * @returns {string[]} List of model ids
         */
        async getActiveModels() {
            const activeViews = await this.getActiveViews()
            return activeViews.map(view => view.modelId).unique()
        },

        /**
         * Get all the subscription plans declared on Stripe
         * 
         * @async
         */
        async getSubscriptionPlans() {
            return await kiss.ajax.request({
                url: "/getSubscriptionPlans",
                method: "get",
            })
        },

        /**
         * Get the period start, as locale date
         * 
         * @returns {string}
         */
        getPeriodStart() {
            return (this.periodStart) ? new Date(this.periodStart).toLocaleDateString() : ""
        },

        /**
         * Get the period end, as locale date
         * 
         * @returns {string}
         */
        getPeriodEnd() {
            return (this.periodEnd) ? new Date(this.periodEnd).toLocaleDateString() : ""
        },

        /**
         * Check if the trial period is expired
         * 
         * @returns {boolean}
         */
        trialExpired() {
            if (this.planId != "trial") {
                return false
            }
            return (new Date() > new Date(this.periodEnd))
        },

        /**
         * Check if there is a subscription (active or not)
         * 
         * @returns {boolean}
         */
        hasSubscription() {
            return (this.planId != "trial" && this.planId != "guest" && this.planId != "none")
        },

        /**
         * Subscribe to a plan
         */
        subscribeTo(planId) {
            kiss.ajax.request({
                    url: "/subscribe",
                    method: "post",
                    body: JSON.stringify({
                        planId
                    })
                })
                .then(data => {
                    if (data && data.redirectURL) {
                        window.location.href = data.redirectURL
                    }
                })
        },

        /**
         * Open the Stripe customer's portal
         * 
         * @async
         */
        async openCustomerPortal() {
            const response = await kiss.ajax.request({
                url: "/stripeCreatePortal",
                method: "get"
            })

            if (response.portalUrl) window.open(response.portalUrl)
        }
    }
});
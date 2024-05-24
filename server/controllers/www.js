/**
 * Public pages controller
 * 
 * Experimental features / Work in progress
 * 
 * - Serves pre-generated static pages for bots
 * - convert hierarchical path to parametric path
 * - Redirect to SPA if the user agent is not a bot (aka human)
 */
const isbot = require("isbot")
const puppeteer = require("puppeteer")
const fs = require("fs")
const fsp = fs.promises
const path = require("path")
const url = require("url")
const jsdom = require("jsdom")
const {
    JSDOM
} = jsdom

const wwwController = {

    /**
     * Route either to the static SEO-friendly page, or the dynamic page used by KissJS SPA
     */
    async process(req, res) {
        const ui = req.path_1
        const content = req.path_2
        const param = req.path_3
        const userAgent = req.headers["user-agent"]
        const isBot = isbot(userAgent)

        if (isBot && req.url.indexOf(".") == -1) {

            // Check the cache
            const staticFile = await wwwController.getHtmlFromCache(req)

            if (staticFile) {
                // File exists
                log("The requested static file exists: " + req.url)
                res.status(200).send(staticFile)

            } else {

                // Build static content from a dynamic page
                log("The requested static file does not exist: " + req.url)
                const html = await wwwController.crawl(req)
                res.status(200).send(html)
            }
        } else {

            const targetUrl = wwwController.getTargetUrl(req)
            res.redirect(301, targetUrl)
        }
    },

    /**
     * Check if a static html file has already been generated
     */
    async getHtmlFromCache(req) {
        const parsedUrl = url.parse(req.url, true)
        const requestPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, "")
        const filePath = path.join(__dirname, "../../../" + requestPath + ".html")

        try {
            await fsp.access(filePath)
            const data = await fsp.readFile(filePath, "utf8")
            return data

        } catch (err) {
            log(err)
            return null
        }
    },

    /**
     * Convert a hierarchical url into a parametric url for SPA
     */
    getTargetUrl(req) {
        const ui = req.path_1 // Used to set #ui=
        const content = req.path_2 // Used to set #content=
        const param = req.path_3 // Blog parameter: either a page number, or a slug
        const rootUrl = req.protocol + "://" + req.hostname
        let targetUrl

        if (content == "blog") {
            targetUrl = `${rootUrl}/client/www/index.html#ui=${ui}&content=${content}&page=${param}`

        } else if (content == "blogPost") {
            targetUrl = `${rootUrl}/client/www/index.html#ui=${ui}&content=${content}&postId=${param}`

        } else {
            targetUrl = `${rootUrl}/client/www/index.html#ui=${ui}&content=${content}`
        }

        return targetUrl
    },

    /**
     * Crawl an SPA page and returns the generated HTML
     * 
     * @param {object} req 
     * @returns {string} HTML
     */
    async crawl(req) {
        const targetUrl = wwwController.getTargetUrl(req)

        // Init puppeteer to crawl the page which is dynamically built with JS
        const browser = await puppeteer.launch({
            headless: "new",
            ignoreHTTPSErrors: true,
            args: ["--ignore-certificate-errors"]
        })

        const page = await browser.newPage()
        await page.goto(targetUrl, {
            waitUntil: "networkidle2"
        })

        let html = await page.evaluate(() => document.documentElement.outerHTML)
        await browser.close()

        // Remove unnecessary informations from the HTML file
        html = wwwController.cleanHTML(html)

        // Save the generated static HTML
        const parsedUrl = url.parse(req.url, true)
        const requestPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, "")
        const savePath = path.join(__dirname, "../../../" + requestPath + ".html")
        const saveDir = path.dirname(savePath)

        fs.mkdirSync(saveDir, {
            recursive: true
        })

        fs.writeFileSync(savePath, html)

        log(`The static HTML file was successully saved here: ${savePath}`)
        return html
    },

    /**
     * Remove content which is unnecessary for indexation bots
     * - extra lines & spaces
     * - scripts
     * - styles
     * - span
     * - attributes like class, style, id
     * 
     * @param {string} html 
     * @returns {string} Cleaned html
     */
    cleanHTML(html) {
        // Remove comments
        html = html.replace(/<!--[\s\S]*?-->/g, '')

        // Remove extra new lines and extra spaces
        html = html
            .replace(/(\r\n|\n|\r){2,}/gm, '\n')
            .replace(/ +/gm, ' ')
            .replace(/(^\s+|\s+$)/gm, '')
            .replace(/>\s+</gm, '><')

        const dom = new JSDOM(html)
        const document = dom.window.document

        // Remove scripts
        const scripts = document.querySelectorAll("script")
        scripts.forEach(script => script.remove())

        // Remove CSS
        const styles = document.querySelectorAll('link[rel="stylesheet"]')
        styles.forEach(style => style.remove())

        // Remove all classes
        let allElements = document.querySelectorAll('*')
        for (let i = 0; i < allElements.length; i++) {
            allElements[i].removeAttribute("class")
            allElements[i].removeAttribute("style")
            allElements[i].removeAttribute("id")
        }

        // Remove <span> elements but keep their content
        let spanElements = Array.from(document.querySelectorAll("span"))
        for (let i = 0; i < spanElements.length; i++) {
            let parent = spanElements[i].parentNode
            while (spanElements[i].firstChild) {
                parent.insertBefore(spanElements[i].firstChild, spanElements[i])
            }
            parent.removeChild(spanElements[i])
        }

        return dom.serialize()
    }
}

module.exports = wwwController
/**
 * Class Booking
 * 
 * The booking component shows a timeline from a start date to an end date.
 * 
 * Each day displays clickable slots.
 * Slots can be defined by a range of hours (example: 8 - 18), or a specific array of slots, like this:
 * slots: [
 *      {
 *          name: "Morning",
 *          startTime: 8,
 *          endTime: 12
 *      },
 *      {
 *          name: "Afternoon",
 *          startTime: 14,
 *          endTime: 17
 *      }
 *  ]
 * 
 * @ignore
 */
kiss.ux.Booking = class Booking extends kiss.ui.Component {
    constructor() {
        super()
    }

    /**
     * Generates a Booking from a JSON config
     * @param {object} config - JSON config
     * @returns {HTMLElement}
     * 
     * @example:
     * createBooking({
     *      startDate: new Date(),
     *      endDate: new Date("2020-10-09"),
     *      startTime: 8,
     *      endTime: 18
     * })
     */
    init(config = {}) {
        super.init(config)
        const id = this.id

        // Adjust starting & ending dates
        this.startDate = (config.startDate) ? new Date(config.startDate) : new Date()
        this.endDate = new Date(this.startDate)

        // Adjust starting & ending times
        this.startTime = config.startTime || 0
        this.endTime = config.endTime || 23

        // Set a specific list of slots
        this.slots = this.config.slots || null
        
        if (config.endDate) this.endDate = new Date(config.endDate)
        else this.endDate.setDate(this.endDate.getDate() + 7)

        // Adjust date format
        this.dateRenderer = config.dateRenderer || this.renderDate

        // Assembly
        this.innerHTML = `<div class="booking">${this.renderBooking()}</div>`
        this.booking = this.querySelector(".booking")

        // Set properties
        this.hours = this.querySelector(".booking-hours") || {}
        this.days = this.querySelector(".booking-days") || {}

        this._setProperties(config, [
            [
                ["display"],
                [this.style]
            ],
            [
                ["flex", "position", "top", "left", "width", "height", "margin", "padding", "background", "backgroundColor", "borderColor", "borderRadius", "borderStyle", "borderWidth", "boxShadow"],
                [this.booking.style]
            ]
        ])

        // Manage the click on a slot
        this.onclick = function(event) {
            let slot = event.target.parentNode.parentNode.querySelector(".booking-day-slot")
            let date = slot.getAttribute("date")
            let start = slot.getAttribute("start")
            let end = slot.getAttribute("end")

            if (typeof this.config.action === "function") this.config.action({
                date: date,
                start: start,
                end: end
            })
        }

        return this
    }

    /**
     * Render the booking within a start date and an end date
     */
    renderBooking() {
        let date = this.startDate
        let week = ""
        
        for (let day = 0; date < this.endDate; day++) {
            date.setDate(date.getDate() + 1)
            week += this.renderDay(date)
        }
        return week
    }

    /**
     * Render a day in the booking.
     * It's composed of a name (ex: 1 septembre 2020)
     * @param {*} date 
     */
    renderDay(date) {
        let day = date.getDay()
        let isWeekEnd = (day === 6) || (day === 0)

        //if (isWeekEnd) return ""

        return `<div class="booking-day" day="${date.toISO()}">
                    <div class="booking-day-header">${this.dateRenderer(date)}</div>
                    <div class="booking-day-details">${this.renderDayDetails(date, isWeekEnd)}</div>
                </div>`.removeExtraSpaces()
    }

    /**
     * 
     * @param {*} date 
     * @param {*} isWeekEnd 
     */
    renderDayDetails(date, isWeekEnd) {
        let slots = ""
        if (isWeekEnd) return `<div class="booking-day-weeked"></div>`

        // Some specific slots have been setup:
        if (this.slots) {
            return this.slots.map(slot => {
                let txtHourStart = slot.startTime.toString().padStart(2, 0) + ":00"
                let txtHourEnd = slot.endTime.toString().padStart(2, 0) + ":00"
                return this.renderDaySlot(date, txtHourStart, txtHourEnd, slot.name)
            }).join('')
        }

        // No specific slots have been setup, we render a set of hours:
        for (let hour = this.startTime; hour <= this.endTime; hour++) {
            let txtHourStart = hour.toString().padStart(2, 0) + ":00"
            let txtHourEnd = (hour + 1).toString().padStart(2, 0) + ":00"

            slots += this.renderDaySlot(date, txtHourStart, txtHourEnd, "")
        }
        return slots
    }

    /**
     * 
     * @param {*} slotDate 
     * @param {*} slotStart 
     * @param {*} slotEnd 
     * @param {*} slotName 
     */
    renderDaySlot(slotDate, slotStart, slotEnd, slotName) {
        return  `<div class="booking-day-slot" date="${slotDate.toISO()}" start="${slotStart}" end="${slotEnd}">
                    <div class="booking-day-slot-time">${slotStart + " - " + slotEnd}</div>
                    <div class="booking-day-slot-name">${slotName}</div>
                </div>`.removeExtraSpaces()
    }

    /**
     * Render the hours within a day, within a range
     * 
     * @param {number} start 
     * @param {number} end 
     */
    renderHours = function (start, end) {
        let hours = ""
        for (let hour = start; hour <= end; hour++) {
            hours += `<div class="booking-day-hour">${hour.toString().padStart(2, 0)}</div>`
        }
        return hours
    }  
    
    /**
     * Render the date seen at the top of each day in the booking
     * 
     * @param {date} date 
     */
    renderDate(date) {
        return date.toISO()

        /*
        // With Moment.js
        let day = date.getDate()
        let momentDate = moment(date.toISO())
        let weekDay = momentDate.format("dddd")
        let month = momentDate.format("MMMM")
        let year = momentDate.format("YYYY")
        return weekDay + "<br>" + day + " " + month + "<br>" + year
        */
    }    

    /**
     * Update the start / end dates of the booking
     * 
     * @param {date} startDate 
     * @param {date} endDate 
     */
    updateRange(startDate, endDate) {
        this.startDate = new Date(startDate)
        this.endDate = new Date(endDate)
        this.booking.innerHTML = this.renderBooking()
    }
}

// Create a Custom Element and add a shortcut to create it
customElements.define("a-booking", kiss.ux.Booking)
const createBooking = (config) => document.createElement("a-booking").init(config)

;
/**
 * 
 * ## Directory to handle users and groups
 * 
 * @namespace
 * 
 */
kiss.directory = {
    users: [],
    groups: [],
    collaborators: [],
    apiClients: [],
    roles: {},
    index: {},
    colors: {},

    /**
     * Init the address book
     * 
     * @returns {Promise<boolean>} false if users or groups could not be loaded properly
     */
    async init() {
        this._initRoles()

        if (kiss.session.isOnline()) {
            const success = await this._initUsersAndGroups()
            if (!success) return false

            this._initSubscriptions()
        }
        else {
            this._initOfflineUsersAndGroups()
        }
        return true
    },

    /**
     * Init or reset the address book
     * 
     * @private
     * @ignore
     * @return {boolean} false if users, groups, collaborators or API clients could not be loaded properly
     */
    async _initUsersAndGroups() {
        this.users = []
        this.groups = []
        this.collaborators = []
        this.apiClients = []

        await this._loadUsers()
        if (!this.users) return false
        
        await this._loadGroups()
        if (!this.groups) return false

        await this._loadCollaborators()
        if (!this.collaborators) return false

        await this._loadApiClients()
        if (!this.apiClients) return false

        this._buildIndex()
        return true
    },

    /**
     * Init or reset the address book for offline use
     * 
     * @private
     * @ignore
     */
    _initOfflineUsersAndGroups() {
        this.users = [{
            id: kiss.tools.uid(),
            email: "contact@pickaform.com",
            firstName: "Contact",
            lastName: "Pickaform",
            invitedBy: [],
            isCollaboratorOf: [],
            isInvite: false,
            active: true
        }]

        this.groups = [{
            id: kiss.tools.uid(),
            icon: "fas fa-users",
            color: "#00aaee",
            name: "Managers",
            users: ["contact@pickaform.com"]
        }]

        this._buildIndex()
    },

    /**
     * Build a directory index for instant entry search
     * 
     * @private
     * @ignore
     */
    _buildIndex() {
        this.index = {}
        this.users.forEach(user => this.index[user.email] = user)
        this.groups.forEach(group => this.index[group.id] = group)
        this.apiClients.forEach(client => this.index[client.id] = client)

        // this.directory = []
        // this.directory = this.users.concat(this.groups)
    },

    /**
     * Init special directory roles
     * 
     * @private
     * @ignore
     */
    _initRoles() {
        kiss.directory.roles.everyone = {
            type: "role",
            label: txtTitleCase("#everyone"),
            value: "*"
        }

        kiss.directory.roles.authenticated = {
            type: "role",
            label: txtTitleCase("authenticated users"),
            value: "$authenticated"
        }

        kiss.directory.roles.creator = {
            type: "role",
            label: txtTitleCase("the creator of the record"),
            value: "$creator"
        }

        kiss.directory.roles.userId = {
            type: "role",
            label: txtTitleCase("connected user"),
            value: "$userId"
        }

        kiss.directory.roles.nobody = {
            type: "role",
            label: txtTitleCase("#nobody"),
            value: "$nobody"
        }
    },

    /**
     * Subscribe the directory to react to changes
     * 
     * @private
     * @ignore
     */
    _initSubscriptions() {
        if (this.subscriptions) return

        this.subscriptions = [
            // USERS
            subscribe("EVT_DB_INSERT:USER", (msgData) => {
                this.addUser(msgData.data)
                this._buildIndex()
            }),

            subscribe("EVT_DB_UPDATE:USER", (msgData) => {
                this.updateUser(msgData.id, msgData.data)
            }),

            subscribe("EVT_DB_DELETE:USER", (msgData) => {
                this.deleteUser(msgData.id)
                this._buildIndex()
            }),

            // GROUPS
            subscribe("EVT_DB_INSERT:GROUP", (msgData) => {
                this.addGroup(msgData.data)
                this._buildIndex()
            }),

            subscribe("EVT_DB_UPDATE:GROUP", (msgData) => {
                this.updateGroup(msgData.id, msgData.data)
            }),

            subscribe("EVT_DB_DELETE:GROUP", (msgData) => {
                this.deleteGroup(msgData.id)
                this._buildIndex()
            }),

            // API CLIENT
            subscribe("EVT_DB_INSERT:APICLIENT", (msgData) => {
                this.addApiClient(msgData.data)
                this._buildIndex()
            }),

            subscribe("EVT_DB_UPDATE:APICLIENT", (msgData) => {
                this.updateApiClient(msgData.id, msgData.data)
            }),

            subscribe("EVT_DB_DELETE:APICLIENT", (msgData) => {
                this.deleteApiClient(msgData.id)
                this._buildIndex()
            }),

            // COLLABORATION PROCESS
            subscribe("EVT_COLLABORATION:SENT", async () => {
                await this._initUsersAndGroups()
                kiss.pubsub.publish("EVT_DIRECTORY_UPDATED")
            }),

            subscribe("EVT_COLLABORATION:RECEIVED", async () => {
                kiss.pubsub.publish("EVT_DIRECTORY_UPDATED")
            }),

            subscribe("EVT_COLLABORATION:ACCEPTED", async () => {
                await this._initUsersAndGroups()
                kiss.pubsub.publish("EVT_DIRECTORY_UPDATED")
            }),

            subscribe("EVT_COLLABORATION:REJECTED", async () => {
                await this._initUsersAndGroups()
                kiss.pubsub.publish("EVT_DIRECTORY_UPDATED")
            }),            
            
            subscribe("EVT_COLLABORATION:STOPPED", async () => {
                await this._initUsersAndGroups()
                kiss.pubsub.publish("EVT_DIRECTORY_UPDATED")
            })
        ]
    },

    /**
     * Add a user
     * 
     * @param {object} user 
     */
    addUser(user) {
        const hasUser = kiss.directory.users.find(existingUser => existingUser.id == user.id)
        if (hasUser) return
        kiss.directory.users.push(user)
    },

    /**
     * Update a user
     * 
     * @param {string} userId
     * @param {object} update 
     */
    updateUser(userId, update) {
        let user = kiss.directory.users.get(userId)
        Object.assign(user, update)
    },

    /**
     * Delete a user
     * 
     * @param {string} userId
     */
    deleteUser(userId) {
        this.users = this.users.filter(user => user.id != userId)
    },    

    /**
     * Add a group
     * 
     * @param {object} group
     */
    addGroup(group) {
        const hasGroup = kiss.directory.groups.find(existingGroup => existingGroup.id == group.id)
        if (hasGroup) return
        kiss.directory.groups.push(group)
    },    

    /**
     * Update a group
     * 
     * @param {string} groupId 
     * @param {object} update 
     */
    updateGroup(groupId, update) {
        let group = kiss.directory.groups.get(groupId)
        Object.assign(group, update)
    },

    /**
     * Delete a group
     * 
     * @param {string} groupId 
     */
    deleteGroup(groupId) {
        this.groups = this.groups.filter(group => group.id != groupId)
    },

    /**
     * Add an API client
     * 
     * @param {object} client 
     */
    addApiClient(client) {
        const hasClient = kiss.directory.apiClients.find(existingClient => existingClient.id == client.id)
        if (hasClient) return
        kiss.directory.apiClients.push(client)
    },

    /**
     * Update an API client
     * 
     * @param {string} clientId
     * @param {object} update 
     */
    updateApiClient(clientId, update) {
        let client = kiss.directory.apiClients.get(clientId)
        Object.assign(client, update)
    },

    /**
     * Delete an API client
     * 
     * @param {string} clientId
     */
    deleteApiClient(clientId) {
        this.apiClients = this.apiClients.filter(client => client.id != clientId)
    },

    /**
     * Load active account users
     * 
     * @private
     * @async
     * @returns {object[]} Array of users or false
     */
    async _loadUsers() {
        this.users = await kiss.ajax.request({
            url: "/getUsers"
        })
        return this.users
    },

    /**
     * Load account groups
     * 
     * @private
     * @async
     * @returns {object[]} Array of groups or false
     */
    async _loadGroups() {
        this.groups = await kiss.app.collections.group.find()
        return this.groups
    },

    /**
     * Load account collaborators
     * 
     * @private
     * @async
     * @returns {object[]} Array of collaborators or false
     */
    async _loadCollaborators() {
        this.collaborators = await kiss.ajax.request({
            url: "/getCollaborators"
        })
        return this.collaborators
    },

    /**
     * Load API clients
     * 
     * @private
     * @async
     * @returns {object[]} Array of API clients or false
     */
    async _loadApiClients() {
        this.apiClients = await kiss.ajax.request({
            url: "/getApiClients"
        })
        return this.apiClients
    },

    /**
     * Get a user or a group, given its email (for users) or id (for groups)
     * 
     * @param {string} entryId
     * @returns {}
     */
    getEntry(entryId) {
        return this.index[entryId]
    },

    /**
     * Get a list of users and groups, given their ids
     * 
     * @param {string[]} entryId - Array of ids
     * @returns {object[]} Array of entries
     */
    getEntries(entryIds) {
        return entryIds.map(id => kiss.directory.index[id]).filter(entry => !!entry)
    },

    /**
     * Returns the user name
     * 
     * @param {string} userId 
     * @returns {string}
     */
    getEntryName(userId) {
        const entry = kiss.directory.getEntry(userId)

        if (!entry) return userId

        if (entry.firstName && entry.lastName) {
            // It's a user
            return entry.firstName + " " + entry.lastName
            
        } else {
            // It's a group
            if (entry.users) {
                return entry.name
            }
            else if (entry.name) {
                // It's an API client
                return entry.name
            }

            return entry.email
        }
    },

    /**
     * Get a list of user and group names, given their ids
     * 
     * @param {string[]} entryId - Array of ids
     * @returns {string[]} Array of entry names
     */
    getEntryNames(entryIds) {
        entryIds = [].concat(entryIds)
        return entryIds.map(this.getEntryName)
    },

    /**
     * Returns all the names by which the user can be recognized into ACL lists.
     * 
     * @param {string} userId 
     * @returns {string[]}
     */
    getUserACL(userId) {
        let userACL = ["*"]

        if (kiss.session.isOnline()) {
            // Online
            userACL = userACL.concat(userId)
            if (kiss.session.isAuthenticated()) userACL = userACL.concat("$authenticated")
        }
        else {
            // Offline
            userACL = userACL.concat("$authenticated", "anonymous")
        }

        this.groups.forEach(group => {
            if (group.users.includes(userId)) userACL.push(group.id)
        })
        return userACL
    },

    /**
     * Get the user initials
     * 
     * @param {object} user 
     * @returns {string} The initials
     * 
     * @example
     * const initials = kiss.directory.getUserInitials("david.grossi@pickaform.com")
     * console.log(initials) // "DG"
     */
    getUserInitials(user) {
        if (!user.firstName || !user.lastName) return "??"
        return (user.firstName[0] + user.lastName[0]).toUpperCase()
    },

    /**
     * Get the entry color (randomly assigned at startup)
     * 
     * @param {string} userId 
     * @returns {string} The hex color code
     * 
     * @example
     * const userColor = kiss.directory.getEntryColor("david.grossi@pickaform.com")
     * console.log(userColor) // "#00aaee"
     * 
     */
    getEntryColor(userId) {
        let userColor = kiss.directory.colors[userId]
        if (userColor) return userColor

        userColor = kiss.tools.getRandomColor(0, 20)
        kiss.directory.colors[userId] = userColor
        return userColor
    },

    /**
     * Get users
     * 
     * @param {object} config
     * @param {string} config.sortBy - "firstName" | "lastName" (default)
     * @param {string} config.nameOrder - "firstName" | "lastName" (default)
     * @param {string} config.sortOrder - "asc" (default) | "desc"
     * @param {boolean} config.onlyActiveUsers - true to filter out inactive users
     * @returns {object[]} Array of users
     */
    getUsers(config = {
        sortBy: "lastName",
        nameOrder: "lastName",
        sortOrder: "asc",
        onlyActiveUsers: false
    }) {
        const compareFunction = (config.sortBy == "firstName") ? this._sortByFirstName : this._sortByLastName

        const users = kiss.directory.users
            .filter(user => {
                if (config.onlyActiveUsers == false) return true
                return user.active !== false
            })
            .map(user => {
                return {
                    type: "user",
                    id: user.email,
                    isInvite: user.isInvite,
                    isOwner: user.isOwner,
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    email: user.email,
                    name: (user.firstName && user.lastName) ?
                        ((config.nameOrder == "firstName") ?
                            (user.firstName + " " + user.lastName) :
                            (user.lastName + " " + user.firstName)) : user.email
                }
            })
            .sort(compareFunction)

        if (config.sortOrder == "desc") return users.reverse()
        return users
    },

    /**
     * Get groups
     * 
     * @param {string} sortOrder - "asc" (default) | "desc"
     * @returns {object[]} Array of groups
     */
    getGroups(sortOrder = "asc") {
        const groups = kiss.directory.groups
            .map(group => {
                return {
                    type: "group",
                    id: group.id,
                    name: group.name
                }
            })
            .sort(this._sortByName)

        if (sortOrder == "desc") return groups.reverse()
        return groups
    },

    /**
     * Get API clients
     * 
     * @returns {object[]} Array of API clients
     */
    getApiClients() {
        const apiClients = kiss.directory.apiClients
            .map(client => {
                return {
                    type: "api",
                    id: client.id,
                    name: client.name
                }
            })
            .sort(this._sortByName)

        return apiClients
    },    

    /**
     * Sort by user firstName
     * 
     * @private
     * @ignore
     */
    _sortByFirstName(a, b) {
        if (a.firstName.toLowerCase() < b.firstName.toLowerCase()) return -1
        if (a.firstName.toLowerCase() > b.firstName.toLowerCase()) return 1
        return 0
    },

    /**
     * Sort by user lastName
     * 
     * @private
     * @ignore
     */
    _sortByLastName(a, b) {
        if (a.lastName.toLowerCase() < b.lastName.toLowerCase()) return -1
        if (a.lastName.toLowerCase() > b.lastName.toLowerCase()) return 1
        return 0
    },

    /**
     * Sort by group name
     * 
     * @private
     * @ignore
     */
    _sortByName(a, b) {
        if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
        if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
        return 0
    },

    /**
     * Dialog to change the user first name and last name
     * 
     * @param {string} userId 
     */
    async editUsername(userId) {
        const user = await kiss.app.collections.user.findOne(userId)
        const initialFirstName = user.firstName
        const initialLastName = user.lastName

        createPanel({
            id: "edit-user-infos",
            title: txtTitleCase("#title edit name"),
            icon: "fas fa-edit",
            layout: "vertical",
            align: "center",
            verticalAlign: "center",
            modal: true,
            closable: true,
            draggable: true,

            defaultConfig: {
                width: 350,
                labelWidth: 150,
                fieldWidth: 200
            },

            items: [
                {
                    id: "edit-firstName",
                    type: "text",
                    label: txtTitleCase("first name"),
                    value: user.firstName,
                    required: true,
                    min: 2,
                    max: 50
                },
                {
                    id: "edit-lastName",
                    type: "text",
                    label: txtTitleCase("last name"),
                    value: user.lastName,
                    required: true,
                    min: 2,
                    max: 50
                },
                {
                    type: "button",
                    text: txtTitleCase("#button edit name"),
                    icon: "fas fa-check",
                    height: 40,
                    margin: "20px 0px 10px 0px",

                    action: () => {
                        const success = $("edit-user-infos").validate()
                        if (!success) return

                        const firstName = $("edit-firstName").getValue()
                        const lastName = $("edit-lastName").getValue()
                        
                        // No change: exit
                        if (initialFirstName == firstName && initialLastName == lastName) {
                            $("edit-user-infos").close()
                            return true
                        }

                        // Change: confirm
                        createDialog({
                            type: "danger",
                            title: txtTitleCase("#title edit name"),
                            buttonOKPosition: "left",
                            message: txtTitleCase("#confirm edit name", null, {
                                firstName,
                                lastName
                            }),
                            action: async () => {
                                $("edit-user-infos").close()
                                await user.update({
                                    firstName,
                                    lastName
                                })

                                // Update session informations
                                localStorage.setItem("session-firstName", firstName)
                                localStorage.setItem("session-lastName", lastName)
                                kiss.pubsub.publish("EVT_USERNAME_UPDATED")
                            }
                        })
                    }
                }
            ]
        }).render()
    }
}

;
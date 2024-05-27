/**
 * 
 * kiss.directory
 * 
 */
module.exports = {
    accounts: {},
    users: {},
    groups: {},

    /**
     * - Retrieve all the accounts, users, and groups from the database and put them in cache
     * - For each user, populate the "groups" attribute to associate the groups he belongs to
     */
    async init() {

        // Retrieve users
        const users = await kiss.db.find("user", {})

        users.forEach(user => {
            if (!this.users[user.accountId]) this.users[user.accountId] = {}
            user.groups = []
            this.users[user.accountId][user.email] = user;

            if (user.isCollaboratorOf) {
                user.isCollaboratorOf.forEach(accountId => {
                    if(!this.users[accountId]) this.users[accountId] = {}
                    this.users[accountId][user.email] = user
                })
            }
        })
        log.ack(`kiss.directory - ${users.length} users found`)

        // Retrieve groups
        const groups = await kiss.db.find("group", {})

        groups.forEach(group => {
            if (!this.groups[group.accountId]) this.groups[group.accountId] = {}
            this.groups[group.accountId][group.id] = group
            
            const users = this.users[group.accountId]
            if (!users) return

            // Populate "groups" field in users
            let unknownUsers = []
            group.users.forEach(userEmail => {
                let userRecord = users[userEmail]

                if (!userRecord) {
                    // log(`kiss.directory.init - User ${userEmail} not found`)
                    unknownUsers.push(userEmail)
                    return
                }

                userRecord.groups.push(group.id)
            })

            // Clean groups of unknown users
            group.users = group.users.filter(userId => !unknownUsers.includes(userId))
        })
        log.ack(`kiss.directory - ${groups.length} groups found`)

        // Retrieve accounts
        const accounts = await kiss.db.find("account", {})
        accounts.forEach(account => this.accounts[account.id] = account)
        log.ack(`kiss.directory - ${accounts.length} accounts found`)
    },

    /**
     * Get all the accounts, sorted by creation date
     * 
     * @returns {object[]} Array of accounts
     */
    getAccounts() {
        return Object.keys(this.accounts).map(accountId => this.accounts[accountId]).sort((a, b) => a.createdAt - b.createdAt)
    },

    /**
     * Get the first account
     * This is used to get the main account when the server is not multi-tenant
     * 
     * @returns {object} First created account
     */
    getFirstAccount() {
        const accounts = this.getAccounts()
        return accounts[0]
    },

    /**
     * Get all the users of an account
     * 
     * @param {string} accountId 
     * @returns {object} Hash of users
     */
    getUsers(accountId) {
        return this.users[accountId]
    },

    /**
     * Get a user from an account
     * 
     * @param {string} accountId
     * @param {string} userId
     * @returns {object} A user
     */    
    getUser(accountId, userId) {
        return this.users[accountId][userId]
    },

    /**
     * Get all the groups of an account
     * 
     * @param {string} accountId 
     * @returns {object} Hash of users
     */    
    getGroups(accountId) {
        return this.groups[accountId]
    },

    /**
     * Get a group from an account
     * 
     * @param {string} accountId
     * @param {string} groupId
     * @returns {object} A group
     */     
    getGroup(accountId, groupId) {
        return this.groups[accountId][groupId]
    },

    /**
     * Get all the groups a user belongs to
     * 
     * @param {string} accountId
     * @param {string} userId
     * @returns {string[]} The list of group ids
     */      
    getUserGroups(accountId, userId) {
        if (!this.users[accountId]) return []
        if (!this.users[accountId][userId]) return []
        return this.users[accountId][userId].groups || []
    },

    /**
     * Get all the names by which a user can be identified in an account
     * 
     * @param {string} accountId
     * @param {string} userId
     * @returns {string[]} The list of names, including the groups the user belongs to
     */  
    getUserACL(accountId, userId) {
        return ["*", userId].concat(this.getUserGroups(accountId, userId))
    },

    /**
     * Get a user or a group from an account
     * 
     * @param {string} accountId
     * @param {string} entryId
     * @returns {object} The directory entry
     */      
    getEntry(accountId, entryId) {
        return this.getUser(accountId, entryId) || this.getGroup(accountId, entryId)
    },

    /**
     * Get all the users or groups which ids are in the given list
     * 
     * @param {string} accountId
     * @param {string} entryIds
     * @returns {object[]} The directory entry list
     */  
    getEntries(accountId, entryIds) {
        return entryIds.map(entryId => this.getEntry(accountId, entryId)).filter(entry => !!entry)
    },

    /**
     * Get an entry name (user or group) from its id
     * 
     * @param {string} accountId
     * @param {string} entryId
     * @returns {string} The entry name
     */     
    getEntryName(accountId, entryId) {
        const entry = this.getEntry(accountId, entryId)
        if (!entry) return entryId

        if (entry.users) {
            // It's a group
            return entry.name
        } else {
            // It's a user
            if (entry.firstName && entry.lastName) {
                return entry.firstName + " " + entry.lastName
            }

            return entry.email
        }
    },

    /**
     * Get all the entry names (user or group) from their ids
     * 
     * @param {string} accountId
     * @param {string} entryId
     * @returns {string[]} The entry name list
     */      
    getEntryNames(accountId, entryIds) {
        entryIds = [].concat(entryIds)
        return entryIds.map(entryId => this.getEntryName(accountId, entryId))
    },    

    /**
     * Add a new account
     * 
     * Note: the users are grouped by account to accelerate the process of retrieving all the users of an account.
     * 
     * @param {object} account
     */
    addAccount(account) {
        let accountId = account.accountId

	    if (!this.users[accountId]) this.users[accountId] = {}
        if (!this.groups[accountId]) this.groups[accountId] = {}
		
        if (!this.accounts[accountId]) {
            this.accounts[accountId] = account
        }
        else {
            // Should never happen: just in case the account is created twice, we update it
            Object.assign(this.accounts[accountId], account)
        }
    },

    /**
     * Update an update in directory cache
     * 
     * @param {string} accountId 
     * @param {object} update 
     */
    updateAccount(accountId, update) {
        Object.assign(this.accounts[accountId], update)
    },

    /**
     * Add a user to an existing account, and populate its group field
     * 
     * Note: when a user is added, he might already be a member of some groups,
     * because it's possible to add inactive users to groups.
     * 
     * @param {object} user
     */
    addUser(user) {
        const accountId = user.accountId
        user.groups = this.findUserGroups(user)
        this.users[accountId][user.email] = user

	    user.isCollaboratorOf.forEach(accountId => {
		    if(!this.users[accountId]) this.users[accountId] = {}
		    this.users[accountId][user.email] = user
	    })
    },

    /**
     * Update a user in directory cache.
     * If the user is collaborator of other accounts, we also update the cache of these accounts.
     * 
     * @param {object} newUserInfos
     */
    updateUser(newUserInfos) {
        const accountId = newUserInfos.accountId
        const userId = newUserInfos.email

        if (!this.users[accountId]) return
        if (!this.users[accountId][userId]) return

        Object.assign(this.users[accountId][userId], newUserInfos)

        // When a user accept a new collaboration, we need
        const user = this.users[accountId][userId]
        if (!user.isCollaboratorOf) return
        if (!Array.isArray(user.isCollaboratorOf)) return

	    user.isCollaboratorOf.forEach(collaborationAccountId => {
		    if(!this.users[collaborationAccountId]) this.users[collaborationAccountId] = {}
		    this.users[collaborationAccountId][userId] = user
	    })
    },    

    /**
     * Find all the groups the user belongs to
     * 
     * @param {object} user 
     * @returns {string[]} Array of group ids
     */
    findUserGroups(user) {
        let userGroups = []
        const accountId = user.accountId
        const accountGroups = this.groups[accountId] || {}

        Object.values(accountGroups).forEach(group => {
            if (group.users && group.users.includes(user.email)) userGroups.push(group.id)
        })
        return userGroups
    },

    /**
     * Delete a user from directory cache
     * 
     * @param {string} accountId
     * @param {string} userId 
     */
    deleteUser(accountId, userId) {
        const user = this.users[accountId][userId]
        if (!user) return

        this._deleteUserFromAllGroups(accountId, userId)
        delete this.users[accountId][userId]
    },

    /**
     * Delete a user from all the groups he belongs to
     * 
     * @param {string} accountId 
     * @param {string} userId 
     */
    _deleteUserFromAllGroups(accountId, userId) {
        const userGroups = this.getUserGroups(accountId, userId)
        userGroups.forEach(group => {
            group.members = group.members.filter(user => user != userId)
        })
    },

    /**
     * Delete a user from all the given ACL fields
     * 
     * @param {string} accountId
     * @param {string} modelId - Ex: "application"
     * @param {string[]} fields - Ex: ["accessRead", "accessUpdate"]
     * @param {string} userEmail - Ex: "john.doe@gmail.com"
     * @returns {object[]} array of operations to update all records
     */
    async deleteUserFromFields(accountId, modelId, fields, userEmail) {
        const query = fields.map(fieldId => {
            return {
                [fieldId]: userEmail
            }
        })

        const records = await kiss.db.find(modelId, {
            $and: [{
                    accountId
                },
                {
                    $or: query
                }
            ]
        })

        // No records impacted = no operations to return
        if (records.length == 0) return []

        // Build the Map of operations
        let operations = []

        records.forEach(record => {
            const updates = {}
            fields.forEach(fieldId => {
                const currentValue = record[fieldId] || []
                const newValue = currentValue.filter(entry => entry != userEmail)
                updates[fieldId] = newValue
            })

            const operation = {
                modelId,
                recordId: record.id,
                updates
            }
            operations.push(operation)
        })

        // Update all records at once
        await kiss.db.updateBulk(operations)
        return operations
    },

	/**
	 * Cleanup all user references in fields that are declared as "ACL" fields in the models configuration.
     * 
     * Note:
     * - ACL fields are fields that contain user emails or group ids
     * - they must be marked as "isACL: true" in the model configuration to be taken into account
     * 
	 * @param {string} accountId
	 * @param {string} email
	 * @returns {object[]} Array of operations that will be propagated with EVT_DB_UPDATE_BULK
	 */
	async cleanupAllUserReferences(accountId, email) {
        let promises = []
        for (modelACLFields of kiss.acl.fields) {
            log.info("kiss.directory.cleanupAllUserReferences - Cleaning up user references in model " + modelACLFields.modelId)
            promises.push(kiss.directory.deleteUserFromFields(accountId, modelACLFields.modelId, modelACLFields.fields, email))
        }

        let results = await Promise.all(promises)
        return results.flat()
	},

    /**
     * Add a group
     * 
     * @param {object} group 
     */
    addGroup(group) {
        if (!this.groups[group.accountId]) this.groups[group.accountId] = {}
        this.groups[group.accountId][group.id] = group
    },

    /**
     * Update a group in the directory cache when it's updated in the database
     * 
     * @param {string} accountId
     * @param {string} groupId 
     * @param {object} update 
     */
    updateGroup(accountId, groupId, update) {
        try {
            const group = this.groups[accountId][groupId]
            if (!group) return

            if (update.users) {
                let addedUsers = []
                let deletedUsers = []
                const currentUsers = group.users
                const newUsers = update.users
                
                currentUsers.forEach(user => {
                    if (!newUsers.includes(user)) deletedUsers.push(user)
                })
                
                newUsers.forEach(user => {
                    if (!currentUsers.includes(user)) addedUsers.push(user)
                })

                addedUsers.forEach(userId => {
                    this._addGroupToUser(accountId, userId, groupId)
                })
                
                deletedUsers.forEach(userId => {
                    this._deleteGroupFromUser(accountId, userId, groupId)
                })
            }

            Object.assign(group, update)

        } catch (err) {
            log("kiss.directory.updateGroup - Error:")
            log(err)
        }
    },

    /**
     * Delete a group
     * TODO: remove the group from all ACL fields
     * 
     * @param {string} accountId
     * @param {string} groupId 
     */
    deleteGroup(accountId, groupId) {
        const group = this.groups[accountId][groupId]
        if (!group) return
        delete this.groups[accountId][groupId]
    },

    /**
     * Add group to user
     * 
     * @private
     * @ignore
     * @param {string} accountId 
     * @param {string} userId 
     * @param {string} groupId 
     */
    _addGroupToUser(accountId, userId, groupId) {
        // console.log(`kiss.directory - Adding group ${groupId} to user ${userId}`)
        this.users[accountId][userId].groups.push(groupId)
    },

    /**
     * Delete group from user
     * 
     * @private
     * @ignore
     * @param {string} accountId 
     * @param {string} userId 
     * @param {string} groupId 
     */
    _deleteGroupFromUser(accountId, userId, groupId) {
        // console.log(`kiss.directory - Deleting group ${groupId} from user ${userId}`)
        const newUserGroups = this.users[accountId][userId].groups.filter(userGroupId => userGroupId != groupId)
        this.users[accountId][userId].groups = newUserGroups
    },

    /**
     * Convert a list of recipients, users or groups, into a list of emails.
     * Recipients given as uid are groups, and they are exploded into multiple emails.
     * 
     * @param {string} accountId 
     * @param {string[]} recipients 
     * @returns {string} List of emails, separated by a comma
     * 
     * @example
     * const accountId = "8797a0ab-fdda-4937-973d-1f4b9523ec0c"
     * const users = ["bob@pickaform.com", "d266f871-3624-4cb7-9efa-b1c742a0fefd"] // Second item is a group id
     * 
     * const recipients = kiss.directory.toEmail(accountId, users)
     * console.log(recipients) // "bob@pickaform.com, john@pickaform.com
     */
    toEmail(accountId, recipients) {
        const groups = this.groups[accountId]

        recipients = [].concat(recipients)
        recipients = recipients.map(recipient => {
            if (!kiss.tools.isUid(recipient)) return recipient

            const groupUsers = groups[recipient].users
            if (groupUsers) return groupUsers
            return []
        })

        // Flatten + unique + remove "*" from recipients + separate recipients by a comma
        recipients = recipients.flat()
        recipients = recipients.unique()
        recipients = recipients.filter(recipient => recipient != "*")
        return recipients.join(",")
    }
}
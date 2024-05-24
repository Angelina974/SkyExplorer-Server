/**
 * Helper functions to convert filter and sort options to MongoDb syntax
 */
module.exports = {
	/**
	 * Convert a filter config into a Mongo query expression
	 *
	 * @param {Array} filter - The filter config to convert to Mongo syntax
	 * @returns {object} The Mongo query expression
	 * @example
	 * If the filter config is:
	 * {
	 *   type: "filter",
	 *   fieldId: "firstName",
	 *   operator: "contains",
	 *   value: "wilson"
	 * }
	 *
	 * It will return:
	 * {firstName: /wilson/i}
	 *
	 */
	convertFilter: function (filter, req) {
		const operators = {
			"<>": "$ne",
			"<": "$lt",
			">": "$gt",
			"<=": "$lte",
			">=": "$gte"
		}
		
		let query = {}

		//
		// Date filters
		//
		if (filter.fieldType == "date") {

			if (filter.value == "$today") {
				filter.value = kiss.formula.TODAY()
			} 

			if (filter.dateOperator == "today") {
				filter.value = kiss.formula.TODAY()
			}
			else if (filter.dateOperator == "days from now") {
				const today = new Date()
				const adjustedDate = kiss.formula.ADJUST_DATE(today, 0, 0, filter.value)
				filter.value = adjustedDate
			}
			else if (filter.dateOperator == "days ago") {
				const today = new Date()
				const adjustedDate = kiss.formula.ADJUST_DATE(today, 0, 0, -filter.value)
				filter.value = adjustedDate
			}                

			// For sorting reasons, createdAt and updatedAt are saved as ISO strings including time
			// When we compare those fields to other dates, we need to remove the time part:
			if (filter.fieldId == "createdAt" || filter.fieldId == "updatedAt") {
				switch (filter.operator) {
					case "=":
						return {
							$where: `function() {
								return this["${filter.fieldId}"] && (this["${filter.fieldId}"].slice(0, 10) == "${filter.value}")
							}`
						}
		
					case "<>":
						return {
							$where: `function() {
								return this["${filter.fieldId}"] && (this["${filter.fieldId}"].slice(0, 10) != "${filter.value}")
							}`
						}
				}
			}
		}

		//
		// Filter on active user
		//
		if (filter.value == "$userId") {
			filter.value = req.token.userACL // Connected user

			switch (filter.operator) {
				case "=":
					query[filter.fieldId] = {
						$in: filter.value
					}
					return query

				case "<>":
					query[filter.fieldId] = {
						$nin: filter.value
					}
					return query

				case "contains":
					query[filter.fieldId] = {
						$in: filter.value
					}
					return query
				
				case "does not contain":
					query[filter.fieldId] = {
						$nin: filter.value
					}
					return query
			}
		}

		//
		// Other filters
		//
		switch (filter.operator) {
			case "=":
				query[filter.fieldId] = filter.value
				return query

			case "<>":
			case "<":
			case ">":
			case "<=":
			case ">=":
				let operator = operators[filter.operator]
				query[filter.fieldId] = {
					[operator]: filter.value
				}
				return query

			case "contains":
				query[filter.fieldId] = new RegExp(filter.value, "i")
				return query

			case "does not contain":
				return {
					[filter.fieldId]: {
						$not: new RegExp(filter.value, "i")
					}
				}

			case "is empty":
				return {
					$or: [{
						[filter.fieldId]: ""
					},
						{
							[filter.fieldId]: []
						},
						{
							[filter.fieldId]: {
								$exists: false
							}
						}
					]
				}

			case "is not empty":
				return {
					$and: [{
						[filter.fieldId]: {
							$ne: ""
						}
					},
						{
							[filter.fieldId]: {
								$ne: []
							}
						},
						{
							[filter.fieldId]: {
								$exists: true
							}
						}
					]
				}
		}

		return {}
	},

	/**
	 * Convert a filter config into a Mongo query expression
	 *
	 * @param {Array} filterGroup - The filter config to convert to Mongo syntax
	 * @return {object} The Mongo query expression
	 * @example
	 * If the filter config is:
	 * {
	 *      type: "group",
	 *      operator: "and",
	 *      filters: [
	 *          {
	 *              type: "filter",
	 *              fieldId: "firstName",
	 *              operator: "contains",
	 *              value: "wilson"
	 *          },
	 *          {
	 *              type: "filter",
	 *              fieldId: "birthDate",
	 *              operator: ">",
	 *              value: "2020-01-01"
	 *          }
	 *      ]
	 * }
	 *
	 * It will return:
	 * {$and: [
	 *      {firstName: /wilson/},
	 *      {birthDate: {$gt: "2000-01-01"}}
	 * ]}
	 */
	convertFilterGroup: function (filterGroup, req) {
		if (filterGroup.type != "group") return this.convertFilter(filterGroup, req)

		let filters = []

		filterGroup.filters.forEach(filter => {
			if (filter) {
				if (filter.type == "group") {
					// If it's a filter group, then we get the filters of the group recursively
					filters.push(this.convertFilterGroup(filter, req))
				} else {
					// If it's a single filter, we directly get the filter values
					filters.push(this.convertFilter(filter, req))
				}
			}
		})

		let mongoFilter = {}
		mongoFilter["$" + filterGroup.operator] = filters
		return mongoFilter
	},

	/**
	 * Convert an array of sort options into Mongo style
	 *
	 * @param {object[]} sortArray - The array to format to Mongo style
	 * @return {object} - A single object with sort options
	 * @example
	 * - input: [{birthDate: "asc"}, {lastName: "desc"}]
	 * - output: {birthDate: 1, lastName: -1}
	 */
	convertSort: function (sortArray, modelId) {
		const model = kiss.app.models[modelId]

		let mongoSort = {}

		for (let i = 0, length = sortArray.length; i < length; i++) {
			let sortOption = sortArray[i]
			let sortField = Object.keys(sortOption)[0]

			/*
			if (model) {
				let field = model.fields.find(field => field.id == sortField)
				if (field.type == "select") sortField = sortField + ".0"
			}
			*/

			let sortDirection = sortOption[sortField]
			mongoSort[sortField] = ((sortDirection == "asc") ? 1 : -1)
		}
		return mongoSort
	}
}
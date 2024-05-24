/**
 * Helper functions to Sanitize data for mongodb models.
 */
module.exports = {
	/**
	 * Clean (sanitize) data according to the model's accepted fields.
	 *
	 * @param {object} body
	 * @param {string} modelId
	 * @return {object} The sanitized object
	 */
	clean(body, modelId) {
		// Exclude custom models, links, and plugin data
		if (kiss.tools.isUid(modelId)) {
			return body
		}

		// Filter only the accepted fields
		const sanitizedObject = {}
		const acceptedFields = kiss.app.models[modelId].acceptedFields

		Object.keys(body).forEach(key => {
			if (acceptedFields.includes(key)) sanitizedObject[key] = body[key]
		})
		return sanitizedObject
	}
}
const _ = require('lodash')

module.exports = class WebFormPost extends require('../core') {
	events() {
		return {
			preAttack: async () => {
				// console.log('im a web-form-post attack type payload!!')
			}
		}
	}

	async attack(payload) {
		const req = await this.xhaust.Http.post({
			url: this.xhaust.settings.attackUri,
			data: payload
		})
		// req.error can be defined (true, false)
		// req.response can be defined (response, undefined)
		// req.request is always defined
	}
}

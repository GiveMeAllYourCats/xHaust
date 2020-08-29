module.exports = class HttpFormPost extends require('../core') {
	events() {
		return {
			preAttack: async () => {
				console.log('im a http-form-post attack type payload!!')
			}
		}
	}
}

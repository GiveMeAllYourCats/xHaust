module.exports = class WebFormPost extends require('../core') {
	events() {
		return {
			preAttack: async () => {
				console.log('im a web-form-post attack type payload!!')
			}
		}
	}

	attack(payload) {
		console.log('oh noes, attack payload!', payload)
	}
}

module.exports = class Http extends require('../classes/tags') {
	constructor() {
		super()
	}

	async preAttackPhaseStart() {
		console.log('http preAttackPhaseStart', this.xHaust.root)
	}

	async preAttackPhaseEnd() {
		console.log('http preAttackPhaseStart', this.xHaust.root)
	}
}

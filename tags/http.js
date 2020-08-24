module.exports = class Http extends require('../classes/tags') {
	constructor() {
		super()
	}

	async preAttackPhaseStart() {
		console.log('http preAttackPhaseStart')
		const results = await this.xHaust.Analyzer.httpFormSniff(this.xHaust.settings.uri)
	}

	async preAttackPhaseEnd() {
		console.log('http preAttackPhaseStart')
	}
}

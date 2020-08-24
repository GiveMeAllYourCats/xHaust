module.exports = class Analyzer extends require('../classes/package') {
	constructor() {
		super()
	}

	// Analyzer.run is run before a attack usually to get more info about the target server
	async run() {
		await this.xHaust.event.emit('analyzerStart')
		const result = await this.xHaust.Http.get({
			uri: this.xHaust.settings.uri
		})

		const dom = result.response.dom
		this.results = {}

		// Form detection
		const formSelector = dom.querySelectorAll('form')
		this.results.form = formSelector ? formSelector : false

		await this.xHaust.event.emit('analyzerEnd', this.results)
	}
}

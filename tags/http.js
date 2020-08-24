var ping = require('ping')
const { PerformanceObserver, performance } = require('perf_hooks')

module.exports = class Http extends require('../classes/tags') {
	constructor() {
		super()
	}

	async preAttackPhaseStart() {
		this.xHaust.Debug.log('http preAttackPhaseStart')

		this.measurements = {}
		const obs = new PerformanceObserver(items => {
			for (let item of items.getEntries()) {
				this.measurements[item.name] = Math.round(item.duration)
			}
			performance.clearMarks()
		})
		obs.observe({ entryTypes: ['measure'] })

		// Check if host is alive
		this.xHaust.Debug.info(`Sending ping to ${this.xHaust.settings.uri.host}`)
		performance.mark('ping')
		const hostIsUp = await new Promise((resolve, reject) => {
			ping.sys.probe(
				this.xHaust.settings.uri.host,
				(isAlive, err) => {
					if (err) return reject(err)
					resolve(isAlive)
				},
				{ timeout: 5 }
			)
		})
		performance.measure('ping')
		if (!hostIsUp) {
			throw new Error(`${this.xHaust.settings.uri.host} is not responding to a ping`)
		}
		this.xHaust.Debug.success(
			`${this.xHaust.settings.uri.host} is responding to a ping (${this.measurements.ping}ms)`
		)

		// Check latency
		performance.mark('httpGet')
		let backoff = 1
		const timeout = () => {
			this.xHaust.Debug.warn(
				`It's taking a very long time to check the webserver for latency on ${this.xHaust.settings.uri.href}`
			)
			backoff *= 2
			setTimeout(timeout.bind(this), 1000 * backoff)
			if (backoff >= 10) {
				throw new Error(`webserver of ${this.xHaust.settings.uri.href} took too long to respond`)
			}
		}
		setTimeout(timeout.bind(this), 2000)
		await this.xHaust.Http.get({
			uri: this.xHaust.settings.uri
		})
		clearTimeout(timeout)
		performance.measure('httpGet')

		const results = await this.xHaust.Analyzer.httpFormSniff(this.xHaust.settings.uri)
	}

	async preAttackPhaseEnd() {
		this.xHaust.Debug.log('http preAttackPhaseStart')
	}
}

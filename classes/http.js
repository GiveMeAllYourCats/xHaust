const http = require('http')
const https = require('https')
const TorAgent = require('toragent')
const _ = require('lodash')
const axios = require('axios')
const SocksProxyAgent = require('socks-proxy-agent')
const async = require('async')

module.exports = class Http {
	constructor(options = {}) {
		return new Promise(async (resolve, reject) => {
			this.options = options
			this.options.timeout = _.get(options, 'timeout', 20000)
			this.options.retry = _.get(options, 'retry', {
				times: 2,
				interval: function (retryCount) {
					return 50 * Math.pow(2, retryCount)
				}
			})

			// Create axios agent
			this.axios = this.createAxios()
			this.axios.defaults = Object.assign({}, { timeout: 5000 }, _.get(this.options, 'defaults.axios', {}))
			console.log(this.axios.defaults)

			// Create tor agent
			if (this.options.tor) {
				const agent = await TorAgent.create()
				this.axiosTor = this.createAxios({ proxy: { host: agent.socksHost, port: agent.socksPort } })
			}

			// Create proxy agent
			if (this.options.socksProxy) {
				const host = this.options.socksProxy.split(':')[0]
				const port = this.options.socksProxy.split(':')[1]
				this.axiosProxy = this.createAxios({ proxy: { host, port } })
			}

			return resolve(this)
		})
	}

	createAxios(options = {}) {
		let httpAgent, httpsAgent
		if (options.proxy) {
			options.proxy.port = parseInt(options.proxy.port)
			httpAgent = new SocksProxyAgent(`socks5h://${options.proxy.host}:${options.proxy.port}`)
			httpsAgent = new SocksProxyAgent(`socks5h://${options.proxy.host}:${options.proxy.port}`)
		} else {
			httpAgent = new http.Agent({ keepAlive: true })
			httpsAgent = new https.Agent({ keepAlive: true })
		}

		const instance = axios.create({
			httpAgent,
			httpsAgent,
			timeout: 60000
		})

		return instance
	}

	async request(options) {
		return new Promise((resolve, reject) => {
			async.retry(
				this.options.retry,
				async () => {
					console.log('req', options)
					if (typeof options === 'string') options = { url: options }
					let axiosSelector = this.axios

					if (options.tor && this.options.tor) {
						axiosSelector = this.axiosTor
					}

					if (options.proxy) {
						axiosSelector = this.axiosProxy
					}

					return await axiosSelector(options)
				},
				(err, result) => {
					if (err) return reject(err)
					return resolve(result)
				}
			)
		})
	}
}

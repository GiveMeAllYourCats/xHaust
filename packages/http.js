const http = require('http')
const https = require('https')
const TorAgent = require('toragent')
const _ = require('lodash')
const axios = require('axios')
const SocksProxyAgent = require('socks-proxy-agent')
const async = require('async')
const faker = require('faker')
const HTMLParser = require('fast-html-parser')

module.exports = class Http extends require('../classes/package') {
	constructor(options = {}) {
		super()
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

		const headers = {}

		if (this.options.randomUserAgent) {
			headers['User-Agent'] = faker.internet.userAgent()
		}

		const instance = axios.create({
			httpAgent,
			httpsAgent,
			headers,
			timeout: 60000
		})

		return instance
	}

	async get(options) {
		options.method = 'get'
		return this.request(options)
	}

	async post(options) {
		options.method = 'post'
		return this.request(options)
	}

	async request(options) {
		return new Promise((resolve, reject) => {
			async.retry(
				this.options.retry,
				async () => {
					if (typeof options === 'string') options = { url: options }

					// Select type of axios agent
					// Normal
					let axiosSelector = this.axios

					// Tor
					if (options.tor && this.options.tor) {
						axiosSelector = this.axiosTor
					}

					// Proxy
					if (options.proxy) {
						axiosSelector = this.axiosProxy
					}

					// Make the request
					try {
						axiosSelector = await axiosSelector(options)
					} catch (err) {
						// Error 😨
						if (err.response) {
							/*
							 * The request was made and the server responded with a
							 * status code that falls out of the range of 2xx
							 */
							// return console.log(err.response.status)
						} else if (err.request) {
							/*
							 * The request was made but no response was received, `err.request`
							 * is an instance of XMLHttpRequest in the browser and an instance
							 * of http.ClientRequest in Node.js
							 */
							// return console.log(err.request)
						}
						// Something happened in setting up the request and triggered an Error
						// console.log('Error', err.message)
						// return reject(new Error(err))
					}

					// Parse response with fast-html-parser
					axiosSelector.dom = HTMLParser.parse(axiosSelector.data)

					return axiosSelector
				},
				(err, result) => {
					if (err) return reject(new Error(err))
					return resolve(result)
				}
			)
		})
	}
}

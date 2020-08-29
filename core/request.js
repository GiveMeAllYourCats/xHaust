const http = require('http')
const https = require('https')
const TorAgent = require('toragent')
const _ = require('lodash')
const axios = require('axios')
const SocksProxyAgent = require('socks-proxy-agent')
const async = require('async')
const faker = require('faker')
const HTMLParser = require('fast-html-parser')

module.exports = class Request extends require('./') {
	ORDER = 100
	OPTIONS = [
		['T', 'tor', 'use tor for all HTTP(s) requests', false],
		['s', 'socksProxy <socksProxy>', 'can use a socks5 proxy url. Format: ip:port'],
		['r', 'retries <retries>', 'amount of retries before marking a http request as failed', 6]
	]

	async start() {
		this.retry = {
			times: this.xhaust.settings.retries,
			interval: function (retryCount) {
				return 50 * Math.pow(2, retryCount)
			}
		}
		// Create axios agent
		if (this.xhaust.settings.tor) {
			// Tor agent
			const agent = await TorAgent.create()
			this.axios = this.createAxios({ proxy: { host: agent.socksHost, port: agent.socksPort } })
		} else if (this.xhaust.settings.socksProxy) {
			// socks proxy
			const host = this.xhaust.settings.socksProxy.split(':')[0]
			const port = this.xhaust.settings.socksProxy.split(':')[1]
			this.axios = this.createAxios({ proxy: { host, port } })
		} else {
			// normal
			this.axios = this.createAxios()
		}
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

		if (this.xhaust.settings.randomUserAgent) {
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
				this.retry,
				async () => {
					if (typeof options === 'string') options = { url: options }

					// Make the request
					// console.log(options, selector)
					let response
					try {
						response = await this.axios(options)
					} catch (err) {
						// Error 😨
						// TODO: catch, friendly display etc
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

					// // Parse response with fast-html-parser
					// response.dom = HTMLParser.parse(response.data)

					return response
				},
				(err, result) => {
					if (err) return reject(new Error(err))
					return resolve(result)
				}
			)
		})
	}
}

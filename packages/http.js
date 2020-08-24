const url = require('url')
const async = require('async')
const http = require('http')
const https = require('https')
const { TaskTimer } = require('tasktimer')
const { performance } = require('perf_hooks')
const HTMLParser = require('fast-html-parser')

module.exports = class Http extends require('../classes/package') {
	constructor() {
		super()
	}

	request(options) {
		return new Promise(async (resolve, reject) => {
			let request
			async.retry(
				this.xHaust.settings.retry,
				callback => {
					this.xHaust.Debug.debug(`${options.protocol}//${options.host}${options.path}`)
					request = http
						.request(options, response => {
							let err = null
							let body = ''
							if (response.statusCode !== 200) {
								return callback(new Error(`statuscode: ${response.statusCode}`))
							}
							response.setEncoding('utf-8')
							response
								.on('data', function (chunk) {
									body += chunk
								})
								.on('end', function () {
									response.body = body
									response.dom = HTMLParser.parse(body)
									callback(err, response)
								})
						})
						.on('error', err => {
							this.xHaust.Debug.warn(err.toString())
							return callback(new Error(err))
						})
					if (options.write) {
						request.write(options.write)
					}
					request.end()
				},
				async (err, response) => {
					if (err) {
						this.xHaust.Debug.warn(err.toString())
						return reject(err)
					}
					request.write = options.write
					resolve({ response, request })
				}
			)
		})
	}

	get(options) {
		return new Promise(async (resolve, reject) => {
			options.method = 'get'
			resolve(await this.request(this.preRequest(options)))
		})
	}

	post(options) {
		return new Promise(async (resolve, reject) => {
			options.method = 'post'
			resolve(await this.request(this.preRequest(options)))
		})
	}

	preRequest(options) {
		if (!options.url && !options.uri && !options.overide) {
			throw new Error('need url or uri options')
		}

		let uri = options.uri
		if (options.url) {
			uri = url.parse(options.url)
		}

		let requestOptions
		if (options.overide) {
			requestOptions = options.overide
		} else {
			requestOptions = {
				protocol: uri.protocol,
				host: uri.host,
				path: uri.path,
				method: options.method
			}
		}

		return requestOptions
	}
}

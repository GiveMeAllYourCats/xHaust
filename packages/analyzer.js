const dns = require('dns')

module.exports = class Analyzer extends require('../classes/package') {
	constructor() {
		super()
	}

	// Analyzer.httpFormSniff is run before a attack usually to get more info about the target server's http form
	async httpFormSniff(url) {
		const result = await this.xHaust.Http.get({
			uri: url
		})

		const dom = result.response.dom
		const body = result.response.body
		const results = {}

		// Get page title
		const titleRawText = dom.querySelector('title').rawText
		let pageTitle = titleRawText ? titleRawText : 'unknown'

		// Some header detection
		let server
		if (result.response.headers['server']) {
			server = result.response.headers['server']
		}
		let poweredBy
		if (result.response.headers['x-powered-by']) {
			poweredBy = result.response.headers['x-powered-by']
		}
		let cookie
		if (result.response.headers['set-cookie']) {
			cookie = result.response.headers['set-cookie']
		}
		let dnslookup = await new Promise((resolve, reject) => {
			dns.lookup(url.host, function (err, result) {
				if (err) {
					return reject(err)
				}
				resolve(result)
			})
		})

		if (server) this.xHaust.Debug.info(`${url.host} server seems to be: ${server}`)
		if (poweredBy) this.xHaust.Debug.info(`${url.host} seems to be run on: ${poweredBy}`)
		if (cookie) this.xHaust.Debug.info(`${url.href} seems to have cookies`)
		if (dnslookup) this.xHaust.Debug.info(`DNS Lookup: ${url.host} -> ${dnslookup}`)

		// check for possible csrf token
		let csrf = dom.querySelectorAll('input').filter(item => {
			let found = false
			if (item.rawAttrs.indexOf('token') !== -1) found = true
			if (item.rawAttrs.indexOf('Token') !== -1) found = true
			if (item.rawAttrs.indexOf('CSRF') !== -1) found = true
			if (item.rawAttrs.indexOf('Csrf') !== -1) found = true
			return found
		})
		if (csrf.length === 0) csrf = undefined
		if (csrf) {
			this.xHaust.Debug.info(`${url.host} appears to have a csrf token`)
		} else {
			this.xHaust.Debug.info(`${url.host} no csrf token found`)
		}

		// check for possible username
		let username = dom.querySelectorAll('input').filter(item => {
			let found = false
			if (item.rawAttrs.indexOf('username') !== -1) found = true
			if (item.rawAttrs.indexOf('Username') !== -1) found = true
			if (item.rawAttrs.indexOf('user') !== -1) found = true
			if (item.rawAttrs.indexOf('User') !== -1) found = true
			return found
		})
		if (username.length === 0) username = undefined
		if (username) {
			this.xHaust.Debug.info(`${url.host} appears to have a username input`)
		} else {
			this.xHaust.Debug.info(`${url.host} no username input found`)
		}

		// check for possible password
		let password = dom.querySelectorAll('input').filter(item => {
			let found = false
			if (item.rawAttrs.indexOf('password') !== -1) found = true
			if (item.rawAttrs.indexOf('Password') !== -1) found = true
			if (item.rawAttrs.indexOf('pass') !== -1) found = true
			if (item.rawAttrs.indexOf('Pass') !== -1) found = true
			return found
		})
		if (password.length === 0) password = undefined
		if (password) {
			this.xHaust.Debug.info(`${url.host} appears to have a password input`)
		} else {
			this.xHaust.Debug.info(`${url.host} no password input found`)
		}

		// Get post action url
		let actionUrl
		for (let form of dom.querySelectorAll('form')) {
			actionUrl = form.attributes.action ? form.attributes.action : undefined
			actionUrl = actionUrl.replace(/'/g, '')
			actionUrl = actionUrl.replace(/"/g, '')
			if (actionUrl === '') {
				actionUrl = this.xHaust.settings.uri.path
			}
		}
		if (!actionUrl) {
			actionUrl = this.xHaust.settings.uri.path
		}

		this.xHaust.Debug.info(`${url.href} action url is ${actionUrl}`)

		// console.log({ actionUrl, username, password, csrf })

		this.xHaust.Debug.success(`Analyze done`)
		this.results = results
		return results
	}
}

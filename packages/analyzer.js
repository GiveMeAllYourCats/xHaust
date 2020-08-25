const dns = require('dns')

module.exports = class Analyzer extends require('../classes/package') {
	constructor() {
		super()
	}

	// Analyzer.httpFormSniff is run before a attack usually to get more info about the target server's http form
	async httpFormSniff(url) {
		this.url = require('url').parse(url)
		this.result = await this.xHaust.Http.get({
			url: this.url.href
		})

		const results = await Promise.all([this.formAnalyze(), this.httpServerAnalyze()])

		this.xHaust.Debug.success(`Analyze done`)
		this.results = results
		return results
	}

	async httpServerAnalyze() {
		// Get page title
		const titleRawText = this.result.dom.querySelector('title')
		let pageTitle = titleRawText ? titleRawText.rawText : 'unknown'

		// Some header detection
		let server
		if (this.result.headers['server']) {
			server = this.result.headers['server']
		}
		let poweredBy
		if (this.result.headers['x-powered-by']) {
			poweredBy = this.result.headers['x-powered-by']
		}
		let cookie
		if (this.result.headers['set-cookie']) {
			cookie = this.result.headers['set-cookie']
		}
		let dnslookup = await new Promise((resolve, reject) => {
			dns.lookup(this.url.host, function (err, result) {
				if (err) {
					return reject(err)
				}
				resolve(result)
			})
		})

		if (server) this.xHaust.Debug.info(`${this.url.host} server seems to be: ${server}`)
		if (poweredBy) this.xHaust.Debug.info(`${this.url.host} seems to be run on: ${poweredBy}`)
		if (cookie) this.xHaust.Debug.info(`${this.url.href} seems to have cookies`)
		if (dnslookup) this.xHaust.Debug.info(`DNS Lookup: ${this.url.host} -> ${dnslookup}`)

		return true
	}

	async formAnalyze() {
		// check for possible csrf token
		let csrf = this.result.dom.querySelectorAll('input').filter(item => {
			let found = false
			if (item.rawAttrs.indexOf('token') !== -1) found = true
			if (item.rawAttrs.indexOf('Token') !== -1) found = true
			if (item.rawAttrs.indexOf('CSRF') !== -1) found = true
			if (item.rawAttrs.indexOf('Csrf') !== -1) found = true
			if (item.rawAttrs.indexOf('csrf') !== -1) found = true
			return found
		})
		if (csrf.length === 0) csrf = undefined
		if (csrf) {
			this.xHaust.Debug.info(`${this.url.host} appears to have a csrf token`)
		} else {
			this.xHaust.Debug.info(`${this.url.host} no csrf token found`)
		}

		// check for possible username
		let username = this.result.dom.querySelectorAll('input').filter(item => {
			let found = false
			if (item.rawAttrs.indexOf('username') !== -1) found = true
			if (item.rawAttrs.indexOf('Username') !== -1) found = true
			if (item.rawAttrs.indexOf('user') !== -1) found = true
			if (item.rawAttrs.indexOf('User') !== -1) found = true
			return found
		})
		if (username.length === 0) username = undefined
		if (username) {
			this.xHaust.Debug.info(`${this.url.host} appears to have a username input`)
		} else {
			this.xHaust.Debug.info(`${this.url.host} no username input found`)
		}

		// check for possible password
		let password = this.result.dom.querySelectorAll('input').filter(item => {
			let found = false
			if (item.rawAttrs.indexOf('password') !== -1) found = true
			if (item.rawAttrs.indexOf('Password') !== -1) found = true
			if (item.rawAttrs.indexOf('pass') !== -1) found = true
			if (item.rawAttrs.indexOf('Pass') !== -1) found = true
			return found
		})
		if (password.length === 0) password = undefined
		if (password) {
			this.xHaust.Debug.info(`${this.url.host} appears to have a password input`)
		} else {
			this.xHaust.Debug.info(`${this.url.host} no password input found`)
		}

		// Get post action url
		let actionUrl
		for (let form of this.result.dom.querySelectorAll('form')) {
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

		let newUrl = require('url').parse(actionUrl)
		if (!newUrl.protocol) {
			newUrl = require('url').parse(
				`${this.xHaust.settings.uri.protocol}//${this.xHaust.settings.uri.host}${actionUrl}`
			)
		}
		this.xHaust.settings.uri = newUrl
		this.xHaust.Debug.info(`${this.url.href} action url is ${this.xHaust.settings.uri.href}`)

		return true
	}
}

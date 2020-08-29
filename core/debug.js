const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const mkdirp = require('mkdirp')
const moment = require('moment')
const stripAnsi = require('strip-ansi')
const StackTracey = require('stacktracey')
const { bright } = require('ansicolor')
const packagejson = require('../package.json')
const root = require('app-root-path').path

module.exports = class Debug extends require('./') {
	ORDER = 0
	OPTIONS = [
		['-v, --verbose', 'shows all debug messages'],
		['-D, --debugFilter <debugFilter>', 'filter debug messages']
	]

	async start() {
		this.filters = ['']

		process.on('uncaughtException', async e => {
			this.throw(e)
		})
		process.on('unhandledRejection', async e => {
			this.throw(e)
		})

		this.log = (...args) => {
			this.displayMsg('log', args)
		}

		this.warn = (...args) => {
			this.displayMsg('warn', args)
		}

		this.debug = (...args) => {
			this.displayMsg('debug', args)
		}

		this.success = (...args) => {
			this.displayMsg('success', args)
		}

		this.info = (...args) => {
			this.displayMsg('info', args)
		}

		this.error = (...args) => {
			this.displayMsg('error', args)
		}

		this.fatal = (...args) => {
			this.displayMsg('fatal', args)
		}
	}

	async throw(e) {
		const stacktrace = (await new StackTracey(e).cleanAsync()).asTable()
		this.fatal(e)
		// console.log(e.toString())
		// console.log(stacktrace)
		process.exit(1)
	}

	set filter(newFilter) {
		this.filters = newFilter
	}

	displayMsg(type, messages) {
		if (this.filters.includes(type)) {
			return
		}
		const time = `${chalk.keyword('darkgrey')(moment().format('HH:mm:ss'))}`
		const colors = {
			log: {
				bg: chalk.keyword('white'),
				text: chalk.white
			},
			warn: {
				bg: chalk.keyword('orange'),
				text: chalk.bold.white
			},
			debug: {
				bg: chalk.keyword('darkgrey'),
				text: chalk.keyword('grey')
			},
			info: {
				bg: chalk.keyword('cyan'),
				text: chalk.keyword('grey')
			},
			success: {
				bg: chalk.keyword('green'),
				text: chalk.keyword('darkgreen')
			},
			error: {
				bg: chalk.bgRed,
				text: chalk.bold.white
			},
			fatal: {
				bg: chalk.bgRed,
				text: chalk.bold.white
			}
		}

		const typeTxt = type.padEnd(5, ' ')
		const typeDisplay = `${colors[type].text(colors[type].bg(typeTxt.toUpperCase()))}`
		const banner = `${time} ${typeDisplay} `
		let locate = { shift: 2 }
		if (type === 'error' || type === 'fatal') {
			locate = false
		}
		const timeObject = {
			yes: true,
			print: date => banner
		}
		const consoleLogger = require('ololog')
			.configure({
				locate,
				stringify: {
					maxDepth: 3,
					maxArrayLength: 9000,
					maxObjectLength: 9000,
					maxStringLength: 90000
				},
				time: timeObject
			})
			.before('render')

		const consoleMessage = consoleLogger(...messages)
		console.log(consoleMessage)
	}
}

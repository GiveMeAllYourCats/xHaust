const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const mkdirp = require('mkdirp')
const moment = require('moment')
const stripAnsi = require('strip-ansi')
const StackTracey = require('stacktracey')
const { bright } = require('ansicolor')
const packagejson = require('../package.json')

module.exports = class Debug extends require('../classes/package') {
	constructor() {
		super()
		this.logToFile = true
		this.logToConsole = true
		this.firstStart = true
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

	async boot() {
		await this.createDebugger()
	}

	async throw(e) {
		const stacktrace = (await new StackTracey(e).cleanAsync()).asTable()
		this.logToFile = false
		this.fatal(e)
		// console.log(e.toString())
		// console.log(stacktrace)
		if (this.fatalFile) {
			fs.appendFileSync(this.fatalFile, e.toString() + '\n')
			fs.appendFileSync(this.fatalFile, stacktrace + '\n')
		}
		if (this.allFile) {
			fs.appendFileSync(this.allFile, e.toString() + '\n')
			fs.appendFileSync(this.allFile, stacktrace + '\n')
		}
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
		const stream = this.stream
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

		const fileLogger = require('ololog')
			.configure({
				locate: false,
				stringify: {
					maxDepth: 2,
					maxLength: 999999,
					maxArrayLength: 20,
					maxObjectLength: 10,
					maxStringLength: 9000
				},
				time: timeObject
			})
			.before('render')

		const consoleMessage = consoleLogger(...messages)
		const fileMessage = stripAnsi(fileLogger(...messages))
		if (this.logToConsole) {
			console.log(consoleMessage)
		}
		if (this.logToFile) {
			if (!stream[type]) {
				throw new Error(`the stream ${type} is not defined`)
			}
			stream[type].write(`${fileMessage}\n`)
			stream.all.write(`${fileMessage}\n`)
		}
	}

	async createDebugger() {
		this.trace = require('ololog').before('render')
		const opts = { flags: 'a' }
		mkdirp.sync(path.join(this.xHaust.root, 'logs'))
		this.stream = {}
		for (let type of ['log', 'debug', 'info', 'warn', 'error', 'success']) {
			const file = path.join(
				__dirname,
				'..',
				'logs',
				`${moment().format('YYYY-MM-DD')}.${type.toUpperCase()}.txt`
			)
			this.stream[type] = fs.createWriteStream(file, opts)
		}

		this.allFile = path.join(this.xHaust.root, 'logs', `${moment().format('YYYY-MM-DD')}.ALL.txt`)
		this.stream.all = fs.createWriteStream(this.allFile, opts)

		this.fatalFile = path.join(this.xHaust.root, 'logs', `${moment().format('YYYY-MM-DD')}.FATAL.txt`)

		if (!fs.existsSync(this.fatalFile)) {
			const stream = fs.createWriteStream(this.fatalFile, opts)
			stream.close()
		}
	}
}

const path = require('path')
const url = require('url')
const pkg = require('./modules/pkg')
const mods = require('./modules/mods')
const banner = require('./modules/banner')
const List = require('./classes/list')
const packagejson = require('./package.json')
const Emittery = require('emittery')
const cliProgress = require('cli-progress')
const root = require('app-root-path')
const queryString = require('query-string')

const DEFAULT_SETTINGS = {
	attackUri: 'http://127.0.0.1/admin/login',
	user: undefined,
	userFile: undefined,
	pass: undefined,
	passFile: undefined,
	test: false,
	mods: ['http', 'post', 'urlencoded'],
	limitParallel: 120,
	useGui: false,
	retries: 10,
	batchSize: 1000,
	input: 'csrf=tokenCSRF',
	output: 'username=:username:&password=:password:&csrf=:csrf:'
}

module.exports = class xHaust {
	constructor() {
		return new Promise(async (resolve, reject) => {
			await this.create()
			return resolve(this)
		})
	}

	// Executed when xhaust is created
	async create() {
		this.root = root.path
		await pkg.load(this)
		this.event = new Emittery()
	}

	// Entry is always made via the launch function, be it via unit test, cli or w/e
	async launch(launchOptions = {}) {
		if (DEFAULT_SETTINGS) {
			await this.init(launchOptions)
		}

		return await this.preAttack()
	}

	// Will run commander to inquirer options from user
	async runCommander() {
		await banner.show()
		const commanderSettings = await this.Commander.inquiry()
		this.Debug.debug('Commander settings', commanderSettings)
		this.settings = Object.assign({}, this.settings, commanderSettings)
		this.Debug.debug('Merged commander settings with default settings')
	}

	// do everything whats needed before launch
	async init(launchOptions = {}) {
		this.settings = DEFAULT_SETTINGS

		// Debug filters
		this.Debug.filter = ['debug', 'log', 'warn', 'info']
		this.Debug.filter = ['nothing'] // Debug env flag here?

		if (launchOptions.commander) {
			await this.runCommander()
		}

		if (launchOptions.settings) {
			this.settings = Object.assign({}, this.settings, launchOptions.settings)
		}

		// Input & Output normalize
		this.settings.input = queryString.parse(this.settings.input)
		this.settings.output = queryString.parse(this.settings.output)

		// Protocol processing
		this.settings.uri = url.parse(this.settings.attackUri)
		delete this.settings.attackUri

		// Retry setting normalize
		this.settings.retry = {
			times: parseInt(this.settings.retries),
			interval: function (retryCount) {
				return 50 * Math.pow(2, retryCount)
			}
		}
		this.Debug.success(`Started ${packagejson.name} v${packagejson.version}`)
		await mods.load(this)
		return this
	}

	async loadLists() {
		this.Debug.debug('Loading all needed lists')
		this.settings.bruteforce = {}
		this.settings.bruteforce.user = this.settings.user
		if (this.settings.userFile) {
			this.Debug.debug(`Using userFile "${this.settings.userFile}"`)
			this.settings.bruteforce.user = await new List(this.settings.userFile)
		}

		this.settings.bruteforce.pass = this.settings.pass
		if (this.settings.passFile) {
			this.Debug.debug(`Using passFile "${this.settings.passFile}"`)
			this.settings.bruteforce.pass = await new List(this.settings.passFile)
		}
	}

	// Everything that needs to be done before the attack loop can begin
	async preAttack() {
		this.Debug.debug('Pre attack phase')
		this.Debug.debug('mods of attack:', this.settings.mods.join('-'), '@', this.settings.uri.href)
		await this.loadLists()
		await this.event.emit('preAttackPhaseStart')
		this.total = 0
		this.done = 0
		this.usernames = 0
		this.passwords = 0
		if (this.settings.bruteforce.user.constructor.name === 'List') {
			this.usernames += this.settings.bruteforce.user.total
		} else {
			this.usernames = 1
		}
		if (this.settings.bruteforce.pass.constructor.name === 'List') {
			this.passwords += this.settings.bruteforce.pass.total
		} else {
			this.passwords = 1
		}
		this.total = this.usernames * this.passwords

		await this.event.emit('preAttackPhaseEnd')
		await this.attack()
	}

	async attack() {
		await this.event.emit('attackPhaseStart')

		this.bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
		this.bar.start(this.total, 0)

		let finished = false
		while (!finished) {
			// Get next password
			let password = this.settings.bruteforce.pass
			if (password.constructor.name === 'List') {
				let nextPassword = await password.next()
				if (nextPassword.done) {
					return await this.postAttack('passwordlist exhausted')
				}
				password = nextPassword.value
			}

			// Get next username
			let username = this.settings.bruteforce.user
			if (username.constructor.name === 'List') {
				let nextUsername = await username.next()
				if (nextUsername.done) {
					return await this.postAttack('userlist exhausted')
				}
				username = nextUsername.value
			}

			// this.Debug.log({ username, password })
			await this.event.emit('attack', { username, password })
			this.done++
			this.bar.update(this.done)
		}

		this.bar.stop()

		await this.event.emit('attackPhaseEnd')
	}

	async postAttack(reason = 'unknown') {
		await this.event.emit('postAttackPhaseStart')
		await this.event.emit('postAttackPhaseEnd')

		console.log(`\n\nQuitting xHaust.\nReason: ${reason}\n\nByeBye...`)
		process.exit() // we are done here!
	}
}

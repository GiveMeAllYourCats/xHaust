const path = require('path')
const url = require('url')
const pkg = require('./modules/pkg')
const tags = require('./modules/tags')
const banner = require('./modules/banner')
const List = require('./classes/list')
const packagejson = require('./package.json')
const Emittery = require('emittery')
const cliProgress = require('cli-progress')

module.exports = class xHaust {
	DEFAULT_SETTINGS = {
		attackUri: 'http://10.10.10.191/admin/login',
		user: undefined,
		userFile: undefined,
		pass: undefined,
		passFile: undefined,
		test: false,
		tags: ['http', 'post', 'urlencoded'],
		limitParallel: 120,
		useGui: false,
		retries: 10,
		batchSize: 1000,
		input: 'csrf=tokenCSRF',
		output: 'username=:username:&password=:password:&csrf=:csrf:'
	}

	constructor() {
		return new Promise(async (resolve, reject) => {
			await this.create()
			return resolve(this)
		})
	}

	// Executed when xhaust is created
	async create() {
		this.root = require('app-root-path').path
		await pkg.load(this)
		this.event = new Emittery()
	}

	// Entry is always made via the launch function, be it via unit test, cli or w/e
	async launch(launchOptions = {}) {
		if (this.DEFAULT_SETTINGS) {
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
		this.settings = this.DEFAULT_SETTINGS
		delete this.DEFAULT_SETTINGS

		// Debug filters
		this.Debug.filter = ['debug', 'log', 'warn', 'info']
		this.Debug.filter = ['nothing'] // Debug env flag here?

		if (launchOptions.commander) {
			await this.runCommander()
		}

		if (launchOptions.settings) {
			this.settings = Object.assign({}, this.settings, launchOptions.settings)
		}

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

		await tags.load(this)
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
		this.Debug.debug('Tags of attack:', this.settings.tags.join('-'), '@', this.settings.uri.href)
		await this.loadLists()
		await this.event.emit('preAttackPhaseStart')
		// Calculate total items todo:
		this.total = 0
		if (this.settings.bruteforce.user.constructor.name === 'List') {
			this.total += this.settings.bruteforce.user.total
		}
		if (this.settings.bruteforce.pass.constructor.name === 'List') {
			this.total += this.settings.bruteforce.pass.total
		}

		console.log(this.total)
		process.exit()

		await this.event.emit('preAttackPhaseEnd')
		await this.attack()
	}

	async attack() {
		await this.event.emit('attackPhaseStart')

		// // create a new progress bar instance and use shades_classic theme
		// const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

		// // start the progress bar with a total value of 200 and start value of 0
		// bar1.start(200, 0);

		// // update the current value in your application..
		// bar1.update(100);

		// // stop the progress bar
		// bar1.stop();

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

		this.Debug.log({ username, password })
		await this.event.emit('attack', { username, password })
		await this.event.emit('attackPhaseEnd')
		await this.attack()
	}

	async postAttack(reason = 'unknown') {
		await this.event.emit('postAttackPhaseStart')
		await this.event.emit('postAttackPhaseEnd')

		console.log(`Stopped xHaust.\nReason: ${reason}\n\nByeBye...`)
		process.exit() // we are done here!
	}
}

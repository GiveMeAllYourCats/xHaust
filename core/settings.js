const { program } = require('commander')
const packagejson = require('../package.json')
const url = require('url')
const colorize = require('json-colorizer')
const chalk = require('chalk')
const _ = require('lodash')

module.exports = class Settings extends require('./') {
	ORDER = 2
	OPTIONS = [
		['a', 'attackUri <attackUri>', 'URI to attack'],
		['u', 'user <user>', 'username to use in attack payload', 'admin'],
		['U', 'userFile <userFile>', 'file full of usernames to use in attack payload'],
		['p', 'pass <pass>', 'password to use in attack payload'],
		['P', 'passFile <passfile>', 'file full of passwords to use in attack payload', '/opt/rockyou.txt'],
		['t', 'type <type>', 'payload type to use for this attack (Ex. http-form-post)', 'web-form-post'],
		['i', 'input <input>', 'input configuration for payload', 'csrf=tokenCSRF'],
		[
			'o',
			'output <output>',
			'output configuration for payload',
			'username=:username:&password=:password:&csrf=:csrf:'
		],
		['l', 'maxParallel <maxParallel>', 'max parallel attack in one batch', 80],
		['b', 'batchSize <batchSize>', 'attack batch size length', 1000],
		['d', 'dryRun', 'executes the attack in dry run mode', false]
	]

	// events() {
	// 	return {
	// 		preAttack: async () => {
	// 			console.log('hi from settigns')
	// 		}
	// 	}
	// }

	async add(option) {
		if (!this.foundOptions) {
			this.foundOptions = []
		}
		if (_.includes(this.foundOptions, option)) {
			throw new Error(`The setting ${option} already exists!`)
		}
		this.foundOptions.push(option)
	}

	async start() {
		program.name('xhaust').usage('[options]')
		program.version(packagejson.version)
		program.exitOverride()
		const example = '-v -a http://127.0.0.1/admin/login -u admin -P /opt/rockyou.txt -t http-form-post'

		program.on('--help', () => {
			console.log('')
			console.log('Example call:')
			console.log(chalk.bold.white(`  $ xhaust ${example}`))
			process.exit()
		})

		// Add this OPTIONS first
		for (let option of this.OPTIONS) {
			await this.add(option[0])
			await this.add(option[1].split(' ')[0])
			program.option(`-${option[0]}, --${option[1]}`, option[2], option[3])
		}

		// Then add rest of core options
		for (let core of this.xhaust.core) {
			if (!core.OPTIONS) {
				core.OPTIONS = []
			}
			if (core.OPTIONS.length >= 1) {
				if (core.constructor.name === 'Settings') continue
				program.option(`\n${core.constructor.name} settings`)
				for (let option of core.OPTIONS) {
					await this.add(option[0])
					await this.add(option[1].split(' ')[0])
					program.option(`-${option[0]}, --${option[1]}`, option[2], option[3])
				}
			}
		}

		// Make sure data is correct
		if (this.xhaust.startupSettings.commander) {
			try {
				program.parse(process.argv)
			} catch (err) {
				if (err.code === 'commander.unknownOption' || err.code == 'commander.missingMandatoryOptionValue') {
					console.log('\n')
					this.xhaust.Debug.error(err.toString().replace('CommanderError: error: ', ''))
					program.outputHelp()
					banner.footer()
					process.exit()
				}
			}

			if (process.argv.length <= 2) {
				this.xhaust.Debug.error('Need command parameters to execute xHaust...')
				program.outputHelp()
				banner.footer()
				process.exit()
			}
		}

		// Now setup the settings.. heh
		this.xhaust.settings = {}
		for (let setting in program._events) {
			setting = setting.replace('option:', '')

			const commanderValue = program[setting]
			if (typeof commanderValue !== 'function' && commanderValue !== undefined) {
				this.xhaust.settings[setting] = commanderValue
			}
		}

		// Any overrides should be configured here, we dont want to polute events
	}
}

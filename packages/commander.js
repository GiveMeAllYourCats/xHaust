const { program } = require('commander')
const packagejson = require('../package.json')
const url = require('url')
const colorize = require('json-colorizer')
const chalk = require('chalk')
const banner = require('../modules/banner')

module.exports = class Commander extends require('../classes/package') {
	constructor() {
		super()
	}

	// Commander.inquiry is used to 'inquir' the user for options
	async inquiry() {
		program.name('xhaust').usage('[options]')
		program.version(packagejson.version)
		program.exitOverride()
		const example =
			'-v -a http://10.10.10.191/admin/login -u fergus -P /usr/share/seclists/Passwords/Common-Credentials/10-million-password-list-top-1000000.txt -t http-post-urlencoded'

		program.on('--help', () => {
			console.log('')
			console.log('Example call:')
			console.log(chalk.bold.white(`  $ xhaust ${example}`))
			process.exit()
		})

		program.option('-a, --attackUri <attackUri>', 'protocol URI to attack')
		program.option('-u, --user <user>', 'username to use in attack payload')
		program.option('-U, --userFile <userfile>', 'file full of usernames to use in attack payload')
		program.option('-p, --pass <pass>', 'password to use in attack payload')
		program.option('-P, --passFile <passfile>', 'file full of passwords to use in attack payload')
		program.option('-l, --limitParallel <limitParallel>', 'max parallel requests at a time')
		program.option('-b, --batchSize <batchSize>', 'the get and post requests batch size')
		program.option('-r, --retries <retries>', 'Amount of retries before marking a http request as failed')
		program.option('-d, --dryRun <dryRun>', 'executes the attack in dry run mode')
		program.option('-v, --verbose', 'Shows all debug messages')
		program.option('-D, --debugFilter <debugFilter>', 'Filter debug messages')
		program.option(
			'-m, --mods <mods>',
			'mods to use for this attack seperated by hypens (Ex. http-post-urlencoded)'
		)
		program.option(
			'-i, --input <input>',
			'input string to use as first scan structure data (Ex. form input names configurations)'
		)
		program.option(
			'-o, --output <output>',
			'output string to use as payload for attack, will replace :username: :password: and :csrf: with respectable values'
		)
		program.option('-g, --useGui', 'enable gui')

		try {
			program.parse(process.argv)
		} catch (err) {
			if (err.code === 'commander.unknownOption' || err.code == 'commander.missingMandatoryOptionValue') {
				console.log('\n')
				this.xHaust.Debug.error(err.toString().replace('CommanderError: error: ', ''))
				program.outputHelp()
				banner.footer()
				process.exit()
			}
		}

		if (process.argv.length <= 2) {
			this.xHaust.Debug.error('Need command parameters to execute xHaust...')
			program.outputHelp()
			banner.footer()
			process.exit()
		}

		const output = {}

		if (program.attackUri) output.attackUri = program.attackUri
		if (program.user) output.user = program.user
		if (program.userFile) output.userFile = program.userFile
		if (program.pass) output.pass = program.pass
		if (program.passFile) output.passFile = program.passFile
		if (program.mods) output.mods = program.mods.split('-')
		if (program.limitParallel) output.limitParallel = program.limitParallel
		if (program.useGui) output.useGui = program.useGui
		if (program.batchSize) output.batchSize = program.batchSize
		if (program.input) output.input = program.input
		if (program.output) output.output = program.output
		if (program.verbose) output.verbose = program.verbose
		if (program.dryRun) output.dryRun = program.dryRun
		if (program.debugFilter) output.debugFilter = program.debugFilter.split(',')
		if (program.retries) output.retries = program.retries

		if (!output.attackUri && !output.test) {
			this.xHaust.Debug.error(`either --attackUri or --test needs to be set`)
			process.exit()
		}

		if (!output.user && !output.userFile && !output.test) {
			this.xHaust.Debug.error(`either --userFile or --user needs to be set`)
			process.exit()
		}

		if (!output.pass && !output.passFile && !output.test) {
			this.xHaust.Debug.error(`either --passFile or --pass needs to be set`)
			process.exit()
		}

		if (output.attackUri && output.test) {
			this.xHaust.Debug.error(`--attackUri and --test cannot be set both`)
			process.exit()
		}

		if (output.attackUri && !output.mods) {
			this.xHaust.Debug.error(`--mods are needed for all attack types, except --test runs`)
			process.exit()
		}

		return output
	}
}

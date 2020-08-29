const packagejson = require('../package.json')
const figlet = require('figlet')
const chalk = require('chalk')

module.exports = class Banner extends require('./') {
	ORDER = 1
	OPTIONS = []

	async start() {
		await this.banner()
	}

	async footer() {
		console.log(`
  xHaust is a tool to crack username/password pairs.
  Licensed under Massachusetts Institute of Technology (MIT) License. 
  The newest version is always available at: https://github.com/GiveMeAllYourCats/xHaust
  This tool is to be used for educational purposes ONLY!`)
	}
	async banner() {
		return await new Promise((resolve, reject) => {
			figlet(
				'xHaust',
				{
					font: 'Cosmike',
					horizontalLayout: 'full',
					verticalLayout: 'controlled smushing',
					width: 80,
					whitespaceBreak: true
				},
				(err, data) => {
					if (err) {
						console.log('Error displaying banner: ', err.toString())
						return resolve()
					}
					console.log(
						`\n\n             ${chalk.keyword('darkgrey')(data.split('\n').join('\n             '))}` +
							chalk.hex('#585858')(`v${packagejson.version}`)
					)
					console.log(
						`\n   💪⚡Blazingly fast brute forcer made in Node.js, exhausting your logins... For science.\n\n`
					)
					return resolve()
				}
			)
		})
	}
}

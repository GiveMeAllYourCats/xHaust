const packagejson = require('../package.json')
const figlet = require('figlet')
const chalk = require('chalk')

const banner = {}
banner.footer = async () => {
	console.log(`
  xHaust is a tool to crack username/password pairs.
  Licensed under Massachusetts Institute of Technology (MIT) License. 
  The newest version is always available at: https://github.com/GiveMeAllYourCats/xHaust
  Please don't use in military or secret service organizations, or for illegal purposes.
  Please do not use on services, or usernames that you do not own.`)
}
banner.show = async () => {
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
module.exports = banner

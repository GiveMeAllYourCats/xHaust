const childProcess = require('child_process')
const exec = {}

exec.run = cmd => {
	return new Promise((resolve, reject) => {
		this.terminal = childProcess.spawn('bash')
		this.terminal.stdin.write(`${cmd}\n`)

		this.terminal.stderr.once('data', data => {
			return reject(data.toString())
		})

		this.terminal.stdout.once('data', data => {
			return resolve(data.toString())
		})

		this.terminal.stderr.once('end', data => {
			return resolve(data.toString())
		})

		this.terminal.once('close', code => {
			console.log(`child process exited with code ${code}`)
		})

		this.terminal.once('exit', code => {
			console.log(`child process exited with code ${code}`)
		})
	})
}

module.exports = exec

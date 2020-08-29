var execShPromise = require('exec-sh').promise

module.exports = class Execute extends require('./') {
	ORDER = 3
	OPTIONS = []

	async run(cmd) {
		let out

		try {
			out = await execShPromise(cmd, true)
		} catch (e) {
			return e
		}

		if (out.stderr) {
			return new Error(out.stderr)
		}

		return out.stdout
	}
}

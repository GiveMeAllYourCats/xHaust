const readline = require('readline')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')

module.exports = class WordlistGenerator extends require('./') {
	ORDER = 70
	OPTIONS = []

	events() {
		return {
			preAttack: async () => {
				this.xhaust.wordlists = {}
				if (this.xhaust.settings.userFile)
					this.xhaust.wordlists.username = await this.generate(this.xhaust.settings.userFile, this.xhaust)

				if (this.xhaust.settings.passFile)
					this.xhaust.wordlists.password = await this.generate(this.xhaust.settings.passFile, this.xhaust)
			}
		}
	}

	async generate(file) {
		return await new Wordlist(file, this.xhaust)
	}
}

class Wordlist {
	constructor(file, xhaust) {
		return new Promise(async (resolve, reject) => {
			this.file = file

			// checks if the list exists
			if (!fs.existsSync(this.file)) {
				throw new Error(`${this.file} does not exist`)
			}

			// count total lines with wc -l (really fast! but erhmm windows??)
			this.total = parseInt(await xhaust.Execute.run(`wc -l < ${this.file}`))

			// some stats
			this.todo = this.total
			this.done = 0

			// create readline interface
			this.readstream = fs.createReadStream(this.file)
			this.readline = readline.createInterface({
				input: this.readstream
			})

			// create the async generator
			this.asyncIterator = this.readline[Symbol.asyncIterator]()
			resolve(this)
		})
	}

	async close() {
		this.readline.close()
		this.readstream.close()
		this.readstream.destroy()
	}

	async get(amount = 1) {
		let items = []
		for (var i = 0; i < amount; i++) {
			const next = await this.asyncIterator.next()
			if (next.done === false) {
				items.push(next.value)
			}
		}
		this.done += amount
		this.todo -= amount
		return items
	}
}

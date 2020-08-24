const readline = require('readline')
const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const { TaskTimer } = require('tasktimer')
const Exec = require('../modules/exec')

module.exports = class List {
	constructor(file) {
		return new Promise(async (resolve, reject) => {
			this.file = file

			// checks if the list exists
			if (!fs.existsSync(this.file)) {
				throw new Error(`${this.file} does not exist`)
			}

			// count total lines with wc -l (really fast! but erhmm windows??)
			this.total = parseInt(await Exec.run(`wc -l < ${this.file}`))

			// some stats
			this.foundExisting = false
			this.todo = this.total
			this.done = 0
			this.readsPerSecond = 0
			new TaskTimer(1000)
				.add(task => {
					this.readsPerSecond = 0
				})
				.start()

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

	async next() {
		this.done++
		this.todo--
		return await this.get()
	}

	async get() {
		const next = await this.asyncIterator.next()
		this.readsPerSecond++
		this.done++
		this.todo--
		return next
	}
}

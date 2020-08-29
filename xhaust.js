/*
MIT License

Copyright (c) 2020 GiveMeAllYourCats

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const glob = require('glob')
const fs = require('fs')
const path = require('path')
const cliProgress = require('cli-progress')
const _ = require('lodash')
const async = require('async')
const Emittery = require('emittery')

module.exports = class xHaust {
	constructor(startupSettings) {
		return new Promise(async (resolve, reject) => {
			this.startupSettings = startupSettings
			this.event = new Emittery()
			try {
				await this.loadCores()
				await this.loadPayload()
				await this.boot()
			} catch (e) {
				return reject(e)
			}
			return resolve(this)
		})
	}

	async loadPayload() {
		if (!fs.existsSync(`./payload/${this.settings.type}.js`))
			throw new Error(`The file ./payload/${this.settings.type}.js does not exist`)
		this.payload = await new (await require(`./payload/${this.settings.type}.js`))()
		this.payload.init(this)
		if (this.payload.start) this.payload.start()
	}

	async loadCores() {
		this['core'] = []
		for (let file of glob.sync(`./${'core'}/*.js`)) {
			const name = path.basename(file, '.js')
			if (name === 'index') continue
			const instance = await new (await require(file))()
			this['core'].push(instance)
		}
		this['core'] = _.orderBy(this['core'], 'ORDER', 'asc')

		for (let obj of this['core']) {
			if (!obj.init) throw new Error(`${obj.constructor.name} does not have a init function`)
			await obj.init(this)
			if (this[obj.constructor.name]) throw new Error(`${obj.constructor.name} already exists`)
			this[obj.constructor.name] = obj
		}

		for (let obj of this['core']) {
			if (obj.start) {
				await obj.start()
			}
		}
	}

	async boot() {
		await this.event.emitSerial('preAttack')
		this.currentUser = (await this.getUser())[0]
		await this.getTotalAttack()
		await this.startProgress()
		while (this.doneAttacks <= this.totalAttacks) await this.attackLoop()
		await this.event.emitSerial('postAttack')
	}

	async startProgress() {
		this.progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
		this.progressBar.start(this.totalAttacks, 0)
	}

	async quit(reason = 'Unknown :(') {
		this.progressBar.update(this.totalAttacks)
		this.progressBar.stop()
		await this.event.emitSerial('quit')
		this.Debug.warn(`Quitting xHaust, reason: ${reason}`)
		this.Banner.footer()
		process.exit()
	}

	async attackLoop() {
		await this.event.emitSerial('preLoop')
		const [username, passwords] = await this.getBatch()

		await async.eachLimit(passwords, this.settings.maxParallel, async password => {
			await this.payload.attack({ username, password })
			this.doneAttacks++
			this.progressBar.update(this.doneAttacks)
		})
		await this.event.emitSerial('postLoop')
	}

	async getTotalAttack() {
		this.doneAttacks = 0
		let users = 1
		let passwords = 1

		if (this.settings.userFile) {
			users = this.wordlist.username.total
		}

		if (this.settings.passFile) {
			passwords = this.wordlist.password.total
		}

		this.totalAttacks = users * passwords
	}

	async getUser(amount = 1) {
		return this.settings.userFile === undefined ? [this.settings.user] : await this.wordlist.username.get(amount)
	}

	async getPass(amount = 1) {
		return this.settings.passFile === undefined ? [this.settings.pass] : await this.wordlist.password.get(amount)
	}

	async getBatch() {
		await this.event.emitSerial('preBatch')
		const passwords = await this.getPass(this.settings.batchSize)
		if (passwords.length === 0) {
			await this.wordlist.password.reset()
			if (this.wordlist.username) {
				// list
				const oldUser = this.currentUser
				this.currentUser = (await this.getUser())[0]
				if (!this.currentUser) {
					return await this.quit('Usernames/Passwords depleted!')
				}
			} else {
				// single
				return await this.quit('Passwords depleted!')
			}
			return await this.getBatch()
		}
		await this.event.emitSerial('postBatch')
		return [await this.currentUser, passwords]
	}
}

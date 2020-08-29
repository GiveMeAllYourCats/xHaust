// const url = require('url')
// const pkg = require('./modules/pkg')
// const mods = require('./modules/mods')
// const banner = require('./modules/banner')
// const List = require('./classes/list')
// const packagejson = require('./package.json')
// const Emittery = require('emittery')
// const cliProgress = require('cli-progress')
// const root = require('app-root-path')
// const { TaskTimer } = require('tasktimer')

const glob = require('glob')
const path = require('path')
const _ = require('lodash')
const Emittery = require('emittery')

module.exports = class xHaust {
	constructor(startupSettings) {
		return new Promise(async (resolve, reject) => {
			this.startupSettings = startupSettings
			this.event = new Emittery()
			try {
				await this.load('core')
				await this.load('type')
				await this.events()
				await this.boot()
			} catch (e) {
				return reject(e)
			}
			return resolve(this)
		})
	}

	async load(type) {
		this[type] = []
		for (let file of glob.sync(`./${type}/*.js`)) {
			const name = path.basename(file, '.js')
			if (name === 'index') continue
			const instance = await new (await require(file))()
			this[type].push(instance)
		}
		this[type] = _.orderBy(this[type], 'ORDER', 'asc')

		for (let obj of this[type]) {
			if (!obj.init) throw new Error(`${obj.constructor.name} does not have a init function`)
			await obj.init(this)
			this[obj.constructor.name] = obj
		}

		for (let obj of this[type]) {
			if (obj.start) {
				await obj.start()
			}
		}
	}

	async events() {
		this.event.onAny(async (name, data) => {
			this.Debug.debug(`Event Emitted > ${name}`)
			if (this[name]) {
				this.Debug.debug(`Event Function found this.${name}()`)
				await this[name](data)
			}
		})
	}

	async boot() {
		await this.event.emitSerial('preAttack')
		await this.attackLoop()
		await this.event.emitSerial('postAttack')
	}

	async quit(reason = 'Unknown :(') {
		this.Debug.warn(`Quitting xHaust, reason: ${reason}`)
		process.exit()
	}

	async attackLoop() {
		await this.event.emitSerial('preLoop')
		const batch = await this.getBatch()
		await this.event.emitSerial('postLoop')
		const finished = false
		if (!finished) {
			await this.attackLoop()
		}
	}

	async getBatch() {
		await this.event.emitSerial('preBatch')
		await this.event.emitSerial('postBatch')
	}
}

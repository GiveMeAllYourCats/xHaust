const glob = require('glob')
const path = require('path')
const appRoot = require('app-root-path').path

const tags = {}
tags.load = async xHaust => {
	return new Promise(async (resolve, reject) => {
		const tags = []

		// Require tags and create instances
		for (let file of glob.sync(path.join(appRoot, 'tags', '*.js'))) {
			let fileName = path.basename(file, '.js')
			fileName = fileName.charAt(0).toUpperCase() + fileName.slice(1)
			tags[fileName] = new (require(path.resolve(file)))()
			tags[fileName].passData(xHaust)
		}
		xHaust.tags = tags

		const event = async (event, data) => {
			for (let tag in xHaust.tags) {
				if (xHaust.tags[tag][event]) {
					await xHaust.tags[tag][event](data)
				} else {
					xHaust.Debug.warn(`${tag}.js does not have ${event} function`)
				}
			}
		}

		xHaust.event.on('preAttackPhaseStart', async data => {
			await event('preAttackPhaseStart', data)
		})

		xHaust.event.onAny((event, data) => {
			xHaust.Debug.info(`EVENT > ${event}`)
		})

		return resolve()
	})
}

module.exports = tags

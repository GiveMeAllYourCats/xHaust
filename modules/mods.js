const glob = require('glob')
const path = require('path')
const appRoot = require('app-root-path').path

const mods = {}

const PREFFERED_PREFIX_MODS = ['http', 'https']
const PREFFERED_SUFFIX_MODS = ['urlencoded']

mods.load = async xHaust => {
	return new Promise(async (resolve, reject) => {
		const mods = []

		// Require mods and create instances
		for (let file of glob.sync(path.join(appRoot, 'mods', '*.js'))) {
			let fileName = path.basename(file, '.js')
			fileName = fileName.charAt(0).toUpperCase() + fileName.slice(1)
			mods[fileName] = new (require(path.resolve(file)))()
			mods[fileName].passData(xHaust)
		}
		xHaust.mods = mods

		xHaust.event.onAny(async (event, data) => {
			// xHaust.Debug.info(`EVENT > ${event}`)
			for (let tag in xHaust.mods) {
				if (xHaust.mods[tag][event]) {
					// xHaust.Debug.info(` > ${tag}.js`)
					await xHaust.mods[tag][event](data)
				} else {
					// xHaust.Debug.warn(`${tag}.js does not have ${event} function`)
				}
			}
		})

		return resolve()
	})
}

module.exports = mods

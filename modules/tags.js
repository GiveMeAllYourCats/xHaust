const glob = require('glob')
const path = require('path')
const appRoot = require('app-root-path').path

const tags = {}

const PREFFERED_PREFIX_TAGS = ['http', 'https']
const PREFFERED_SUFFIX_TAGS = ['urlencoded']

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

		xHaust.event.onAny(async (event, data) => {
			xHaust.Debug.info(`EVENT > ${event}`)
			for (let tag in xHaust.tags) {
				if (xHaust.tags[tag][event]) {
					xHaust.Debug.info(` > ${tag}.js`)
					await xHaust.tags[tag][event](data)
				} else {
					xHaust.Debug.warn(`${tag}.js does not have ${event} function`)
				}
			}
		})

		return resolve()
	})
}

module.exports = tags

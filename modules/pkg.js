const glob = require('glob')
const path = require('path')
const appRoot = require('app-root-path').path

const pkg = {}

// pkg load order
const PREFFERED_PACKAGES_ORDER = []

pkg.load = async bindTo => {
	return new Promise(async (resolve, reject) => {
		// This array hold all packages, easy for reference between packages and xHaust class itself
		xhaust = []

		// Require packages and create instances
		for (let file of glob.sync(path.join(appRoot, 'packages', '*.js'))) {
			let fileName = path.basename(file, '.js')
			fileName = fileName.charAt(0).toUpperCase() + fileName.slice(1)
			bindTo[fileName] = await new (require(path.resolve(file)))()
			xhaust.push(bindTo[fileName])
		}

		// Pass the 'xHaust' reference, this is how all packages and main class can communicate with eachother
		for (let pkg in xhaust) {
			pkg = await xhaust[pkg]
			if (!pkg.passData) {
				throw new Error(`${pkg.constructor.name} does not have the passData function`)
			}
			await pkg.passData(bindTo)
		}

		// Run boot functions (which in order starts the start function in package.js), some classes need them
		for (let pkg in xhaust) {
			pkg = await xhaust[pkg]
			// Start PREFFERED_PACKAGES_ORDER first
			for (let prefferedPkg of PREFFERED_PACKAGES_ORDER) {
				prefferedPkg = pkgs[prefferedPkg]
				if (prefferedPkg && prefferedPkg.packageStarted != true) {
					await prefferedPkg.boot()
				}
			}

			// Then the rest of the packages
			if (pkg.packageStarted != true) {
				await pkg.boot()
			}
		}

		return resolve(xhaust)
	})
}

module.exports = pkg

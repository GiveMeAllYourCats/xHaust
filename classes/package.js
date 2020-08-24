// Packages bootstrapper
module.exports = class Package {
	constructor() {}

	async passData(xHaust) {
		this.xHaust = xHaust
	}

	async boot() {}
}

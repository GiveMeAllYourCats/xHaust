// Mods bootstrapper
module.exports = class Mods {
	constructor() {}

	async passData(xHaust) {
		this.xHaust = xHaust
	}

	async preAttackPhaseStart() {}
	async preAttackPhaseEnd() {}
}

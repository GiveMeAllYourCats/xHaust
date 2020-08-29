module.exports = class Core {
	async init(xhaust) {
		this.xhaust = xhaust

		if (this.events) {
			const events = this.events()
			for (let event in events) {
				this.xhaust.event.on(event, async data => {
					await events[event](data)
				})
			}
		}
	}
}

const Emittery = require('emittery')

const emitter = new Emittery()

;(async () => {
	emitter.on('klappa', async data => {
		console.log(`klappa data: `, data)
		await new Promise(resolve =>
			setTimeout(() => {
				resolve('klarpi')
			}, 1000)
		)
	})

	const barka = emitter.emit('klappa', { barki: true })
	console.log({ barka })
})()

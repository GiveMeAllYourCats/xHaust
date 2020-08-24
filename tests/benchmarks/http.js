const xHaust = require('../../xhaust')
const Benchmark = require('benchmark')
const suite = new Benchmark.Suite()

const express = require('express')
const assert = require('assert')
const app = express()
const main = async () => {
	const xhaust = await new xHaust()
	await xhaust.init()
	suite
		.add('RegExp#test', async () => {
			await xhaust.Http.get({
				overide: {
					host: 'localhost',
					port: 4200,
					path: '/', // the rest of the url with parameters if needed
					method: 'GET' // do GET
				}
			})
		})
		// add listeners
		.on('cycle', function (event) {
			console.log(String(event.target))
		})
		.on('complete', function () {
			console.log('Fastest is ' + this.filter('fastest').map('name'))
		})
		// run async
		.run({ async: true })
}

const server = app.listen(4200, async () => {
	app.get('/', (req, res) => {
		res.send('Hello World!')
	})

	main()
})

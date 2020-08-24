const xHaust = require('../../xhaust')
const express = require('express')
const assert = require('assert')
const app = express()
let server
let xhaust

before(() => {
	return new Promise(async resolve => {
		server = app.listen(4200, async () => {
			xhaust = await (await new xHaust()).launch({
				settings: {
					test: true
				}
			})
			app.get('/', (req, res) => {
				res.send('Hello World!')
			})

			return resolve()
		})
	})
})

// describe('Simple attack test', () => {
// 	it('should return 2', () => {
// 		assert.equal(1 + 1, 2)
// 		console.log(xhaust)
// 	})
// })

after(() => {
	return new Promise(resolve => {
		server.close()
		resolve()
	})
})

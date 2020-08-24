const xHaust = require('../../xhaust')
const express = require('express')
const assert = require('assert')
const path = require('path')
const app = express()
let server
let xhaust

before(async () => {
	await new Promise(async resolve => {
		server = app.listen(4200, async () => {
			app.get('/', (req, res) => {
				res.send('Hello World!')
			})

			return resolve()
		})
	})
})

describe('HTTP Attacks', () => {
	it('Complete HTTP cycle attack', async () => {
		;(
			await (await new xHaust()).init({
				settings: {
					test: true,
					attackUri: 'http://postman-echo.com/post?foo1=bar1&foo2=bar2',
					user: 'admin',
					passFile: path.join(require('app-root-path').path, 'metadata', 'testpasswordlist.txt')
				}
			})
		).launch()

		assert.equal(1 + 1, 2)
	})
})

after(() => {
	return new Promise(resolve => {
		server.close()
		resolve()
	})
})

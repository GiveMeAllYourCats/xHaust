const express = require('express')

const webserver = {}

webserver.start = options => {
	if (!options.port) options.port = 80
	const app = express()

	app.get('/', (req, res) => {
		res.send('Hello World!')
	})

	app.listen(options.port, () => {
		console.log(`Example app listening at http://localhost:${options.port}`)
	})
}

module.exports = webserver

const express = require('express')
const path = require('path')
var csrf = require('csurf')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var handlebars = require('handlebars')
const morgan = require('morgan')
var csrfProtection = csrf({ cookie: true })
var parseForm = bodyParser.urlencoded({ extended: false })

const app = express()
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))

app.use(cookieParser())

server = app.listen(80, async () => {
	app.get('/', (req, res) => {
		res.send('hello world')
	})
	app.get('/admin', (req, res) => {
		res.status(200).send(`success logged in, welcome!`)
	})
	app.get('/admin/login', csrfProtection, (req, res) => {
		res.send(
			handlebars.compile(`
			<html>
				<title>a title</title>
				<head></head>
				<body>
					<h1>Login form</h1>
					<form action="/admin/login" method="post">
						Username: <input type="text" name="username"><br>
						Password: <input type="text" name="password"><br>
						<input type="hidden" name="_csrf" value="{{csrfToken}}"><br>
						<input type="submit" value="Login">
					</form>
				</body>
			</html>
		`)({ csrfToken: req.csrfToken() })
		)
	})
	app.post('/admin/login', parseForm, csrfProtection, (req, res) => {
		if (req.body.username === 'admin' && req.body.password === 'correctpassword') {
			res.redirect('/loggedin')
		}
		res.status(401).send(`error`)
	})
})

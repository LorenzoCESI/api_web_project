var express = require('express');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var myRouter = express.Router();
var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var port = 3000;
var hostname = 'localhost';

var connection = mysql.createConnection({
	host : 'localhost',
	user : 'root',
	password : '',
	database : 'web_project_cesi_2019'//'web_project_cesi_2019'
});

//collect all the users
myRouter.route('/api/users')
.get(function(req, res) {
	connection.query("SELECT * FROM users", function(error, rows, field) {
		if(!!error) {
			console.log('Error in the query...');
		} else {
			res.json(rows);
		}
	});
});

//collect a user with an id
myRouter.route('/api/users/:user_id')
.get(function(req, res) {
	connection.query("SELECT * FROM users WHERE id=" + req.params.user_id, function(error, rows, field) {
		if(!!error) {
			console.log('Error in the query...')
		} else {
			res.json(rows);
		}
	});
});

//access a protected route
myRouter.route('/api/logintoken')
.post(verifyToken, function(req, res) {
	jwt.verify(req.token, 'secretkey', function(error, authData) {
		if(error) {
			res.sendStatus(403);
		} else {
			res.json({authData});
		}
	});
	
});

//add a new user
myRouter.route('/api/register')
.post(function(req, res) {
	const postQuery = "INSERT INTO users (last_name, first_name, email, password) VALUES (?, ?, ?, ?)";
	connection.query(postQuery, [req.body.last_name, req.body.first_name, req.body.email, req.body.password], function(error, results, field) {
		if(!!error) {
			console.log('Error in the addition of the user...');
		} else {
			console.log('User added successfully !');
			connection.query("SELECT * FROM users WHERE id=( SELECT max(id) FROM users)", function(error, rows, field) {
				jwt.sign({rows}, 'secretkey', {expiresIn : '30 days'}, function(error, token) {
					res.json({token});
				});
			});
		}
	});
});

//login 
myRouter.route('/api/login/:email')
.get(function(req, res) {
	connection.query("SELECT * FROM users WHERE email='" + req.params.email + "'", function(error, user, field) {
		if(!!error) {
			console.log('Error in the query...');
		} else if(req.header('authorization') == '9cb986477ea6b412e1571fa18fafd210830399d8762fa87448440950221df1c6') {
			var reqError = '';
			if(user[0] == null) {
				console.log('Email does not exist...');
				reqError = 'no user';
			} else {
				console.log('User connected : ' + req.params.email);
			}
			jwt.sign({user}, 'secretkey', {expiresIn : '30 days'}, function(error, token) {
				res.json({user, token, reqError});
			});
		} else {
			console.log("Unauthorized");
			(res.sendStatus(403));
		}
	});
});

//Api home
myRouter.route('/api/')
.get(function(req, res) {
	res.json({messsage : "Bienvenue sur l'API Node.js de notre projet !", 
				authorization : req.header('authorization')});
});

function verifyToken(req, res, next) {
	const bearerHeader = req.headers['authorization'];
	if(typeof bearerHeader !== 'undefined') {
		const bearer = bearerHeader.split(' ');
		const bearerToken = bearer[1];
		req.token = bearerToken;
		next();
	} else {
		res.sendStatus(403);
	}
}

connection.connect(function(error) {
	if(!!error) {
		console.log('Error...');
	} else {
		console.log('Connected !');
	}
});

app.use(myRouter);
app.listen(port);
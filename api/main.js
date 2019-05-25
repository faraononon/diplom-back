var restify = require('restify');
var fs = require('fs'); 
var util = require('util');
var path = require('path');
var bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const passport = require('passport');
var pool = require('./db.js');
const LocalStrategy = require('passport-local').Strategy;
var port = 8081; 
const corsMiddleware = require('restify-cors-middleware');

var server = restify.createServer({
  name: 'myApp'
});

const cors = corsMiddleware({
    preflightMaxAge: 10, //Optional
    origins: ['http://flexio.beget.tech', 'http://localhost:8080'],
    allowHeaders: ['API-Token'],
    exposeHeaders: ['API-Token-Expiry'],
    credentials: true
});

let users = [  
    {
      id: 1,
      name: "Jude",
      email: "user@email.com",
      password: "password"
    },
    {
      id: 2,
      name: "Emma",
      email: "emma@email.com",
      password: "password2"
    }
  ]

const authMiddleware = (req, res, next) => {  
    if (!req.isAuthenticated()) {
        res.statusCode = 401;
        res.send('You are not authenticated')
    } else {
        return next()
    }
  }

// модуль для обработки запросов 
var apiHandler = require('./api.js'); 

// создание сервера 
server.pre(cors.preflight);
server.use(cors.actual);
server.use(bodyParser({ mapParams: true }));
server.use(cookieSession({
    name: 'mysession',
    httpOnly: false,
    keys: ['vueauthrandomkey'],
    maxAge: 24 * 60 * 60 * 1000
}));
server.use(passport.initialize());
  server.use(passport.session());
server.get('/*', restify.plugins.serveStatic({
    directory: '../css',
    file: 'style.css'
  }));

server.get('/', function (req, res) {
    fs.readFile(path.join('../','index.html'),"utf8", function(err, file) {
        if (err) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.write(err + "\n");
            res.end();
            return;
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(file);
        res.end();
  });
});

passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password"
      },
  
      (username, password, done) => {
        pool.getConnection((err, connection) => {
          if (err) throw err;
          connection.query("SELECT * FROM diploma21.authentication WHERE `Login` = '" + username + "'", function (error, rows, fields) {
            if (error) {
              return res.send(error);
            }	else if (!rows.length) {
              return done(null, false);
            } else if (!( rows[0].Password == password)) {
              return done(null, false);
            } else {
              return done(null, rows[0]);
            }
          });
          pool.releaseConnection(connection);
        });
      }
    )
  )

  passport.serializeUser((user, done) => {  
    done(null, user.id)
  });

  passport.deserializeUser((id, done) => {  
    pool.getConnection((err, connection) => {
      if (err) throw err;
      connection.query("SELECT * FROM diploma21.authentication", function (error, rows, fields) {
        if (error) {
          done(null, false);
        } else {
          let user = rows.find((item) => {
            return item.id === id;
          });
          console.log(user);
          done(null, user);
        }
      });
      pool.releaseConnection(connection);
    });
  });

// выбрать все элементы 
server.get('/api/:name', apiHandler.loadItems);
 
server.post('/api/:name', apiHandler.createItem);

server.put('/api/:name/:id', apiHandler.updateItem);

server.del('/api/:name/:id', apiHandler.removeItem);  

// Авторизация
server.post("/api/login", (req, res, next) => {  
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
  
      if (!user) {
         res.statusCode = 400;
         return res.send([user, "Cannot log in", info]);
      }
  
      req.login(user, err => {
        res.send(user);
      });
    })(req, res, next);
  });

  server.get("/api/logout", function(req, res) {  
    req.logout();
  
    console.log("logged out")
  
    return res.send();
  });

  server.get("/api/user", authMiddleware, (req, res) => {  

    pool.getConnection((err, connection) => {
      if (err) throw err;
      connection.query("SELECT * FROM diploma21.authentication", function (error, rows, fields) {
        let shot = rows.some((item) => {
          return item.id === req.session.passport.user;
        })
        console.log(req.session.passport.user);
        console.log(shot);
        if (error) {
          return res.send(error);
        }	else if (shot) {
          res.send("Checked");
        }
      });
      pool.releaseConnection(connection);
    });
  });
  
 
// обработчик ошибок 
server.on('InternalServer', function(err) {
    err.body = 'oops...error'; 
    res.send(err); 
})

server.listen(port, () => {
    var responseInfo = util.format('Server is running on port %i', port);
    console.log(responseInfo);
})
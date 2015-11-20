var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

// set mongo db and mongoose
var mongo = require('mongodb');
var mongoose = require('mongoose');

// db connection for local machine
var connection_string = process.env.MONGOLAB_URI ||
												process.env.MONGOHQ_URL ||
												'mongodb://localhost:27017/exchange';

// if on openshift, use their db connection
if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
	connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
	process.env.OPENSHIFT_MONGODB_DB_HOST + ":" +
	process.env.OPENSHIFT_MONGODB_DB_PORT + "/exchange";
}

mongoose.connect(connection_string);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongoose connection error:'));

var routes = require('./routes/index');
var users = require('./routes/users');
var listings = require('./routes/listings');
var tests = require('./routes/tests');
var bids = require('./routes/bids');
var communities = require('./routes/communities');
var search = require('./routes/search');
var tags = require('./routes/tags');
var subscriptions = require('./routes/subscriptions');
var notifications = require('./routes/notifications');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'do the ditty itty', saveUninitialized: true, resave: true}));

// make session variable to all views/templates
app.use(function(req, res, next) {
	res.locals.session = req.session;
	next();
});

// list all routes here:
app.use('/subscriptions', subscriptions);
app.use('/notifications', notifications);
app.use('/tags', tags);
app.use('/search', search);
app.use('/users', users);
app.use('/listings', listings);
app.use('/tests', tests);
app.use('/bids', bids);
app.use('/communities', communities);
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;

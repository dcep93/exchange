var express = require('express');
var router = express.Router();
var ObjectID = require('mongodb').ObjectID;
var Listing = require('../model/listing').Listing;
var Tag = require('../model/listing').Tag;
var User = require('../model/user').User;
var Subscription = require('../model/subscription');
var Notification = require('../model/notification');
var auth = require('../auth');
var async = require('async');

// show all tags and ability to subscribe
router.get('/', auth, function(req, res) {
	// getr users notifications
	Notification.find({user: req.session.userId}).populate('subscribed').exec(function(err, notifications) {
		if (err) {
			res.status(500).send({'msg': 'There was a problem loading the notification'});
		} else {
			// res.send(user);
			res.render('notifications', {
				title: "my notifications",
				notifications: notifications.sort(function(a,b) {
					return b.unread - a.unread;
				})
			});
		}
	});
});

// reset unread to zero
router.post('/reset/:tag', auth, function(req, res) {
	Tag.findOne({name: req.params.tag}, function(err, tag) {
		if (err) {
			res.status(500).send({msg: 'error getting tag info'});
		} else {
			Notification.findOneAndUpdate(
				{user: req.session.userId, subscribed: tag._id}, 
				{unread: 0},
				function(err, notif) {
					// fail silently
					res.send({msg: 'success'});
				});
		}
	});
});


module.exports = router;

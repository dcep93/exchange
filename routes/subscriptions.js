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
	Tag.find({}, function(err, tags) {
		if (err) {
			// send err
			res.status(500).send({'msg': 'There was a problem loading the subscriptions'});
		} else {

			function addCount(tag, callback) {
				Listing.count({tags: tag._id}, function(err, count) {
					if (err) {
						// send err
						console.log(err);
					} else {
						var newTag = {};
						newTag.count = count;
						newTag._id = tag._id;
						newTag.name = tag.name;

						Subscription.findOne({subscribed: newTag._id, subscribers: req.session.userId}, function(err, subsc) {
							if (err) {
								console.log(err);
							} else if (subsc) {
								newTag.subscribed = true;
							} else {
								newTag.subscribed = false;
							}
							callback(null, newTag);
						});
					}
				});
			};

			function done(error, result) {
				console.log(result);
				res.render('subscriptions/index', {
					type: 'all',
					title: 'subscriptions',
					subscriptions: result.sort(function(a,b) {
						return b.count - a.count;
					})
				});
			}

			async.map(tags, addCount, done);
		}
	});
});

// show all active subscriptions
router.get('/active', auth, function(req, res) {
	Subscription
		.find({})
		.populate('subscribed')
		.sort({updated: '-1'})
		.exec(function(err, subscriptions) {
			if (err) {
				// send err
				res.status(500).send({'msg': 'There was a problem loading the subscriptions'});
			} else {
				res.render('subscriptions/index', {
					type: 'active',
					title: "subscriptions",
					subscriptions: subscriptions
				});
			}
		});
});

// subscribe to a tag
router.post('/subscribe/:tag_id', auth, function(req, res) {
	// upsert subscription - if !exist, create, otherwise, update
	Subscription
		.findOneAndUpdate(
			{subscribed: req.params.tag_id},
			{subscribed: req.params.tag_id, $push: {subscribers: req.session.userId}},
			{upsert: true},
			function(err, subscription) {
				console.log(subscription);
				if (err) {
					// send err
					res.status(500).send({'msg': 'There was a problem loading the subscriptions'});
				} else {
					res.send({msg: 'subscription added', id: subscription._id});
					// res.redirect('/subscriptions/');
				}
			});
});

// get subscribers for a tag
router.get('/subscribers/:id', auth, function(req, res) {
	Subscription.findOne({_id: req.params.id}).populate('subscribed subscribers').exec(function(err, subscription) {
		if (err) {
		} else {
			res.render('subscriptions/subscribers', {title: 'subscribers', subscription: subscription});
		}
	});
});

module.exports = router;

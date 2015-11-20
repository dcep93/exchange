var express = require('express');
var ObjectID = require('mongodb').ObjectID;
var Tag = require('../model/listing').Tag;
var Listing = require('../model/listing').Listing;
var Subscription = require('../model/subscription');
var daysAgo = require('../utils').daysAgo;
var auth = require('../auth');

var router = express.Router();

router.get('/', function(req, res) {
	Tag.find({}, function(err, tags) {
		if (err) {
			res.status(500).send({err: 'failed in finding posted tags'});
		} else {
			res.json(tags.map(function(e) { return e.name; }));
		}
	});
});

router.get('/:tag', function(req, res) {
	console.log(req.params.tag);
	Tag.findOne({name: req.params.tag}, function(err, tag) {
		console.log(tag._id);
		Listing
			.find({tags: tag._id})
			.populate('owner tags')
			.sort({date: "-1"})
			.exec(function(err, listings) {
				if (err) {
					res.status(500).send({msg: 'db failed finding listings'});
				} else {
					// get number of days ago listed
					var now = new Date(Date.now());
					listings.forEach(function(listing) {
						listing.days = daysAgo(Math.round((now - listing.date) / (1000 * 60 * 60 * 24), 0));
					});

					if (req.session.userId) {
						Subscription.find({subscribed: tag._id, subscribers: req.session.userId}, function(err, sub) {
							console.log("sub len: ", sub.length);
							if (sub.length <= 0) {
								// user not subscribed yet
								var subscribe = true;
							} else {
								// user already subscribed
								var subscribe = false;
							}

							res.render('listings/search', {
								title: "Search Listings",
								type: 'tag',
								subscribe: subscribe,
								tag: tag._id,
								search: "tag: "+req.params.tag,
								listings: listings
							});
						});
					} else {
						res.render('listings/search', {
							title: "Search Listings",
							type: 'tag',
							subscribe: false,
							tag: tag._id,
							search: "tag: "+req.params.tag,
							listings: listings
						});
					}
				}
			});
	});
});

module.exports = router;

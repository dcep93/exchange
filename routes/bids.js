var express = require('express');
var auth = require('../auth');
var ObjectID = require('mongodb')
	.ObjectID;
//var schemas = require('../model/bid');
var Tag = require('../model/listing')
	.Tag;
var Bid = require('../model/bid')
	.Bid;
var Message = require('../model/message')
	.Message;
var User = require('../model/user')
	.User;
var daysAgo = require('../utils')
	.daysAgo;

var app = express();
var router = express.Router();

// GET all messages for a bid
// only return if user is owner of listing OR user is bidder
router.get('/:bid_id/messages', auth, function(req, res, next) {

	// get bid as would in router.get('/:id/'), then get bid's messages 

	Bid.findOne({
		_id: req.param('bid_id')
	}).populate('bidder listing').exec(function(err, bid) {
		if (err) {
			console.log(err);
			res.status(500)
				.send({
					'msg': 'There was a problem finding the bid.'
				});
		} else {

			if (bid) {

				console.log("Bidder ID:" + bid.bidder._id);
				console.log("Session User ID:" + req.session.userId);
				console.log("Bid Listing Owner:" + bid.listing.owner);

				// if user is owner of bid's listing or bidder, return all messages
				if (bid.bidder._id == req.session.userId || bid.listing.owner == req.session.userId) {

					console.log("Retrieving messages...");

					Message
						.find({
							bid: bid._id
						})
						.populate('sender')
						.sort({
							timestamp: 'asc'
						})
						.exec(function(err, messages) {
							if (err) {
								console.log(err);
								res.status(500).send({
									'msg': 'There was a problem loading the messages'
								});
							} else {

								User.findOne({
									_id: bid.listing.owner
								})
									.exec(function(err, seller) {
										if (err) {
											res.status(404)
												.send({
													'msg': 'There was a problem retrieving the seller of this listing.'
												});
										} else {
											res.render('bids/', {
												title: "Messages",
												bid: bid,
												seller: seller,
												messages: messages
											});
										}

									});
							}

						});

				} else {
					res.status(404)
						.send({
							'msg': 'You are not the owner or the bidder.'
						});
				}

			} else {
				res.status(404)
					.send({
						'msg': 'The bid was not found.'
					});
			}

		}
	});

});



// POST a message
router.post('/:bid_id/messages/', auth, function(req, res, next) {

	console.log("In the POST function");

	// get bid as would in router.get('/:id/'), then get bid's messages
	Bid
		.findOne({
			_id: req.param('bid_id')
		})
		.populate('bidder listing')
		.exec(function(err, bid) {
			if (err) {
				res.status(500)
					.send({
						'msg': 'There was a problem finding the bid.'
					});
			} else {

				if (bid) {

					console.log(bid);
					console.log("Bidder ID:" + bid.bidder._id);
					console.log("Session User ID:" + req.session.userId);
					console.log("Bid Listing Owner:" + bid.listing.owner);

					// if user is owner of bid's listing or bidder, return all messages
					if (bid.bidder._id == req.session.userId || bid.listing.owner == req.session.userId) {

						var newMessage = new Message({
							sender: req.session.userId,
							bid: bid,
							content: req.body.content
						});

						newMessage.save(function(err) {
							if (err) {
								res.status(500)
									.send({
										'msg': 'There was a problem sending your message.'
									});
							} else {
								res.redirect('/bids/' + bid._id + '/messages');
							}
						});

					} else {
						res.status(404)
							.send({
								'msg': 'You are not the owner or the bidder.'
							});
					}


				} else {
					res.status(404)
						.send({
							'msg': 'The bid was not found.'
						});
				}

			}



		});
});

module.exports = router;

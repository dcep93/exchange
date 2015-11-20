var express = require('express');
var ObjectID = require('mongodb').ObjectID;
var schemas = require('../model/listing');
var Tag = require('../model/listing').Tag;
var auth = require('../auth');
var Bid = require('../model/bid').Bid;
var User = require('../model/user').User;
var Subscription = require('../model/subscription');
var Notification = require('../model/notification');
var mailer = require('express-mailer');
var daysAgo = require('../utils').daysAgo;

var app = express();

mailer.extend(app, {
	from: 'theman@collegebazaar.com',
	host: 'smtp.gmail.com',
	secureConnection: true,
	port: 465,
	transportMethod: 'SMTP',
	auth: {
		user: 'collegebazaarapp@gmail.com',
		pass: 'pass7wordpass7word'
	}
});

var router = express.Router();

router.get('/', function(req, res) {

	schemas.Listing
	.find({})
	.populate('tags')
	.sort({date: '-1'})
	.exec(function(err, listings){
	  if(err) {
	    return next(err);
	  }
	  else {
			// get number of days ago listed
			var now = new Date(Date.now());
			listings.forEach(function(listing) {
				listing.days = daysAgo(Math.round((now - listing.date) / (1000 * 60 * 60 * 24), 0));
			});

	    res.render('listings/index', {
	      title: "Listings",
	      'listings': listings,
	    });
	  }
	});
});

router.get('/new', function(req, res) {
  res.render('listings/new', { title: 'Create A Listing' });
});

router.get('/:listing_id/edit', function(req, res) {

  var id = new ObjectID(req.params.listing_id);

  schemas.Listing.findOne({"_id": id}, function(err, listing){
    if (err){
      return next(err);
    }
    else if (listing == []){
      var notFound = new Error('no such listing');
      notFound.status = 404;
      return next(notFound);
    }
    else{
      res.render('listings/edit', {
        title: "Edit your listing",
        'listing': listing
      });
    }
  });

});

router.get('/:listing_id', function(req, res, next) {

  var id = new ObjectID(req.params.listing_id);

  schemas.Listing
	.findOne({"_id": id})
	.populate('owner tags')
	.exec(function(err, listing) {
    if (err){
      return next(err);
    }
    else if (listing == null){
      var notFound = new Error('no such listing');
      notFound.status = 404;
      return next(notFound);
    }
    else{
    	console.log(listing)
      res.render('listings/listing', {
        title: listing.title,
        'listing': listing
      });
    }
  });

});

// create new listing
router.post('/', auth, function(req, res) {
	var userString = req.body.listingTags;
	console.log(userString);
	// if user added tags:
	//  - see if in db, then get _id
	//  - otherwise add to db, then get _id
	var listTags = [];
	if (req.body.listingTags !== "") {
		console.log("listing posted with tags");
		console.log(userString);
		// var userTags = userString.replace(/\[|\]/g,'').replace(/"/g,'').split(',');
		var userTags = userString.split(',');
		console.log(userTags);
		Tag
			.find({name: {$in: userTags}}, 'name', function(err, tags) {
				if (err) {
					res.status(500).send({err: 'failed in finding posted tags'});
				} else {
					console.log(tags);
					if (tags.length > 0) {
						console.log("used some existing tags");
						tags.forEach(function(tag) {
							listTags.push(tag._id);
						});

						// get new tags only
						var newTags = userTags.filter(function(tag) {
							if (tags.map(function(e) { return e.name; }).indexOf(tag) < 0) {
								return true;
							}
						});
						console.log("after array diff");
						console.log(newTags);
					} else {
						console.log("no existing tags used");
						newTags = userTags;
					}
				}

				console.log(newTags);

				if (newTags.length > 0) {
					console.log("have new tags to add to db");
					console.log(newTags);
					console.log(typeof(newTags));

					// map to array of objects for mongo
					var addTags = newTags.map(function(elem) {
						return {name: elem};
					});

					Tag.create(addTags, function(err) {
						if (err) {
							res.status(500).send({err: 'failed to add new tags'});
						} else {
							console.log("added new tags");

							Tag.find({name: {$in: newTags}}, function(err, tags) {
								if (err) {
									console.log(err);
									res.status(500).send({err: 'failed to find newly added tags'});
								} else {
									console.log("found newly added tags");
									tags.forEach(function(tag) {
										listTags.push(tag._id);
									});
									var newListing = new schemas.Listing({
										type: 0,
										title: req.body.title,
										location: req.body.location,
										description: req.body.description,
										price: req.body.price,
										owner: req.session.userId,
										tags: listTags
									});

									newListing.save(function(err) {
										if (err) {
											res.status(500).send({'msg': 'There was a problem posting the listing.'});
										}
										else{
											// Send notifications
											listTags.forEach(function(listTag) {
												Subscription.findOne({subscribed: listTag}, function(err, subscription) {
													if (err) {
														res.status(500).send({msg: "error finding subscription"});
													} else if (subscription) {
														console.log('in subscription');
														console.log(subscription);
														subscription.subscribers.forEach(function(user) {
															Notification.findOneAndUpdate(
																{user: user, subscribed: listTag},
																{subscribed: listTag, $inc: {unread: 1}},
																{upsert: true},
																function(err, notification) {
																	if (err) {
																		res.status(500).send({'msg': 'There was a problem loading the notification'});
																	} else {
																		console.log('notification updated');
																		//res.send(notification);
																	}
																});
														});
													}
												});
											});
											console.log('notifications added');
														
											res.redirect('/listings/'+newListing._id);
										}
									});

									console.log("just after found newly added tags");
								}
							});
							console.log("after Tag.find (newly added tags)");
						}
					});
					console.log("after Tag.create");
				} else {
					console.log("no new tags to add");
					console.log(listTags);

					var newListing = new schemas.Listing({
						type: 0,
						title: req.body.title,
						location: req.body.location,
						description: req.body.description,
						price: req.body.price,
						owner: req.session.userId,
						tags: listTags
					});

					newListing.save(function(err) {
						if (err) {
							res.status(500).send({'msg': 'There was a problem posting the listing.'});
						}
						else{
							// Send notifications
							listTags.forEach(function(listTag) {
								Subscription.findOne({subscribed: listTag}, function(err, subscription) {
									if (err) {
										res.status(500).send({msg: "error finding subscription"});
									} else if (subscription) {
										console.log('in subscription');
										console.log(subscription);
										subscription.subscribers.forEach(function(user) {
											Notification.findOneAndUpdate(
												{user: user, subscribed: listTag},
												{subscribed: listTag, $inc: {unread: 1}},
												{upsert: true},
												function(err, notification) {
													if (err) {
														res.status(500).send({'msg': 'There was a problem loading the notification'});
													} else {
														console.log('notification updated');
														//res.send(notification);
													}
												});
										});
									}
								});
							});
							console.log('notifications added');

							res.redirect('/listings/'+newListing._id);
						}
					});
				}
		});
	} else {
		console.log("listing posted without tags");
		var newListing = new schemas.Listing({
						type: 0,
						title: req.body.title,
						location: req.body.location,
						description: req.body.description,
						price: req.body.price,
						owner: req.session.userId,
		});

		newListing.save(function(err) {
			if (err) {
				res.status(500).send({'msg': 'There was a problem posting the listing.'});
			}	else {
				res.redirect('/listings/'+newListing._id);
			}
		});
	}
});


// GET all bids for a listing
// only return if user is owner of listing OR user is bidder
router.get('/:listing_id/bids', auth, function(req, res, next) {

		// get listing as would in router.get('/:id/'), then get listing's bids
		schemas.Listing
			.findOne({_id: req.param('listing_id')})
			.exec(function(err, listing) {
				if (err) {
					res.status(500).send({'msg': 'There was a problem finding the listing.'});
				}

				if (listing) {
					// if user is owner of listing, return all bids
					if (listing.owner == req.session.userId) {
						Bid
							.find({listing: listing._id})
							.populate('bidder')
							.sort({timestamp: '-1'})
							.exec(function(err, bids) {
								if (err) {
									res.status(500).send({'msg': 'There was a problem loading the bids'});
								}

								res.render('listings/bids', {
									title: listing.title,
									bids: bids
								});
						});
					} else {
						Bid
						.find({listing: listing._id, bidder: req.session.userId})
						.populate('bidder')
						.sort({timestamp: '-1'})
						.exec(function(err, bids) {
							if (err) {
								res.status(500).send({'msg': 'There was a problem loading the bids'});
							}

							res.render('listings/bids', {
								title: listing.title,
								bids: bids
							});
						});
					}
				} else {
					res.status(404).send({'msg': 'The listing was not found.'});
				}
		});
});

// POST a new bid for a listing
router.post('/:listing_id/bids', auth, function(req, res, next) {
	schemas.Listing.findOne({_id: req.param('listing_id')}, function(err, listing) {
			if (err) {
				res.status(500).send({'msg': 'There was a problem finding the listing.'});
			}

			if (listing) {

				var newBid = new Bid({
					bidder: req.session.userId,
					listing: listing,
					description: req.body.content
				});

				newBid.save(function(err) {
					if (err) {
						res.status(500).send({'msg': 'There was a problem sending the bid.'});
					} else {
						// get bidder info to send to listing owner
						User.findById(req.session.userId, function(err, bidder) {
							if (err) {
								res.status(500).send({'msg': 'There was a problem finding the bidder.'});
							} else {
								// get listing owner name and email
								User.findById(listing.owner, function(err, lister) {
									if (err) {
										res.status(500).send({'msg': 'There was a problem finding the listing owner.'});
									} else {
										// for testing purposes - if valid email used, send to it, otherwise send to rich
										var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
										var email = re.test(lister.email) ? lister.email : 'richprze@gmail.com';
										// send email to poster
										app.mailer.send('../views/emails/bid.ejs', {
											to: email,
											subject: 'You have a bid on '+listing.title,
											listingUser: lister.name,
											listingURL: req.headers.host + '/listings/' + listing._id,
											listingTitle: listing.title,
											bidder: bidder.name,
											bidMessage: req.body.content,
											bidderEmail: bidder.email
										}, function(err) {
											if (err) {
												console.log(err);
												res.send({'msg': 'There was a problem sending the bid.'});
												return;
											}
										});
										res.status(201);
										res.render('listings/listing', {
											title: listing.title,
											'listing': listing,
											bidSubmitted: "Your reply was sent. The owner will contact you if they wish to transact."
										});
									}
								});
							}
						});
					}
				});
			} else {
				res.status(404).send({'msg': 'The listing does not exist.'});
			}
		});
});

// GET a single bid by bid ID
router.get('/:listing_id/bids/:bid', auth, function(req, res, next) {
		Bid
			.findOne({_id: req.param('bid')})
			.populate('bidder listing')
			.exec(function(err, bid) {
				if (err) {
					res.status(500).send({'msg': 'There was a problem finding the bid'});
				}

				if (bid) {
					// res.send(bid);
					/* Will need to have listing author and user logged in working
					 *
					if (bid.bidder === req.session.userId || bid.listing.author === req.session.userId) {
					*/
					if (bid.bidder == req.session.userId) {
						oneBid = [];
						oneBid.push(bid);
						res.render('listings/bids', {
							title: bid.listing.title,
							bids: oneBid
						});
					} else {
						// user doesn't have access
						res.status(500).send({'msg': 'You do not have access to see this bid.'});
					}
				} else {
					res.status(404).send({'msg': 'The bid does not exist.'});
				}
		})
});


// DELETE a bid
router.delete('/:listing_id/bids/:bid', auth, function(req, res, next) {
	// Only owner of post can delete it
	schema.Listing
	.findOne({_id: req.session.userId})
	.exec(function(err, listing) {
		if (err) {
			res.status(500).send({'msg': 'There was a problem finding the listing'});
		}

		if (listing.owner == req.session.userId) {
			Bid.findOneAndRemove({'_id': req.param('bid')}, function (err) {
				if (err) {
					res.status(500).send({'msg': 'Unable to delete the bid.'});
				} else {
					res.status(200).send({'msg': 'Successfully deleted.'});
				}
			});
		} else {
			res.status(403).send({'msg': 'You do not have permission to delete this bid'});
		}
	});
});

// POST edit a listing
router.post('/:listing_id', function(req, res, next) {
	// Only author of a bid can edit it
	var id = new ObjectID(req.params.listing_id);

	schemas.Listing.findOne({"_id": id}, function(err, listing){
		if (err){
			return next(err);
		}
		else{
			// listing.type = req.body.type;
			listing.type = 0;
			listing.location = req.body.location;
			listing.description = req.body.description;
			listing.price = req.body.price;
			listing.save(function(err) {
				if(err) {
					res.status(500).send({'msg': 'There was a problem editing the listing.'});
				}
				else{
					// res.status(201);
					res.redirect('/');
				}
			});
		}
	});
});

module.exports = router;

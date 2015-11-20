var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../model/user').User;
var Community = require('../model/community');
var Verify = require('../model/user').Verify;
var Listing = require('../model/listing').Listing;
var Bid = require('../model/bid').Bid;
var mailer = require('express-mailer');

var auth = require('../auth');


//Checks to see if the user is logged in already or the request body is invalid
var isLoggedInOrInvalidBody = function(req, res) { //Adapted from the 6.170 p3 demo example at https://github.com/kongming92/6170-p3demo/blob/master/routes/users.js
	console.log('checking for logged in or invalid body');
	if (req.session.userId) {
		delete req.session.userId;
		req.session.loggedin = false;
	}
	if (!(req.body.name && req.body.password)) {
		res.status(400).json({
			success: false,
			err: 'Username and password required.'
		});
		return true;
	}
	return false;
};


/* Get a list of users
Request body: nothing
Response:
- err: error text if something goes wrong
- users: a list of user objects containing [name, communities] pairs
*/

router.get('/', function(req, res) {
	//returns a list of all users and their public information (username, etc.)
	User.find({}).exec(function(err, users) {
		if (err) {
			console.error(err);
			res.status(500).json({
				success: false,
				err: 'Database error'
			}).end();
		} else {
			res.render('users/list', {
				title: 'All College Bazaar users',
				users: users
			});
		}
	});
});


router.get('/new', function(req, res) {
	res.render('users/new', {
		title: 'Add New User'
	});
});


router.get('/login', function(req, res) {
	res.render('users/login', {
		title: 'Sign in'
	});
});
/*
POST /users/
req body: name [String], password [String], email [String]
Response:
	- success: true if successful, false otherwise
	- err: An error message describing what went wrong if unsuccessful
	- id: if successful, the ID of the newly created user
*/
router.post('/', function(req, res) { //Add a new user

	newName = req.body.name;
	newPass = req.body.password;
	newMail = req.body.email;

	if (!newName || !newPass || !newMail) {
		res.render('users/new', {
			title: 'Join College Bazaar',
			success: false,
			err: 'Fill all fields'
		});
	}

	console.log('creating user ' + newName + ', ' + newPass);

	User.findOne({
		$or: [{
			name: newName
		}, {
			email: newMail
		}]
	}, function(err, user) {
		if (err) {
			console.error(err);
			//res.status(500).json({
			res.render('users/new', {
				title: 'Join College Bazaar',
				success: false,
				err: 'Database error; please try again.'
			});
		} else {
			//check username and email
			if (user) {
				//res.status(403).json({
				res.render('users/new', {
					title: 'Join College Bazaar',
					success: false,
					err: 'Username or email already in use'
				});
			} else {
				console.log('user doesnt exist');
				// get email domain
				var eDomain = newMail.match(/[^@]+$/);

				// Check if domain is an existing community. If so, add user to it
				Community.findOne({
					keyword: eDomain[0],
					verifyEmail: true
				}, function(err, community) {
					if (err) {
						console.log(err);
						res.status(500).send({
							msg: 'error looking up community'
						});
					} else {
						console.log(community);

						var newUser = new User({
							name: newName,
							email: newMail,
							password: newPass,
						});


						newUser.save(function(err, user) {
							if (err) {
								console.error(err);
								//res.status(500).json({
								res.render('users/new', {
									title: 'Join College Bazaar',
									success: false,
									err: 'Database error; please try again.'
								});
							} else {
								console.log('user saved!');
								console.log(community);
								if (community) {
									console.log('user email matches a community');
									// send join community email
									var base_url = 'http://' + req.headers.host;
									sendCommVerification(base_url, user, community, res, function(result) {
										if (result.success) {
											console.log('email sent');
										} else {
											console.log('email NOT sent');
										}
									});

								}

								req.session.userId = user._id;
								req.session.userName = user.name;

								res.redirect('home');
								//res.status(200).json({
								//    success: true,
								//    id: newUser._id
								//}).end();

							}
						});
					}
				});
			}
		}
	});
});

router.get('/home', auth, function(req, res) {
	User.findOne({
		_id: req.session.userId
	}).exec(function(err, user) {
		res.render('users/home', {
			title: "Home",
			user: user
		})
	});
});


router.get('/bids', auth, function(req, res, next) {

	Bid.find({

	}).exec(function(err, bids) {
		if (err) {
			return next(err);
		} else {
			res.render('users/bids', {
				title: 'Bids I\'ve placed',
				bids: bids.filter(function(bid) {
					return bid.bidder == req.session.userId
				})
			});
		}
	});
});


router.get('/rbids', auth, function(req, res, next) {

	Bid.find({

	}).populate('listing').exec(function(err, bids) {
		if (err) {
			return next(err);
		} else {

			console.log(bids);
			console.log(bids.filter(function(bid) {
				return bid.listing.owner == req.session.userId
			}));

			res.render('users/rbids', {
				title: 'Bids I\'ve received',
				bids: bids.filter(function(bid) {
					return bid.listing.owner == req.session.userId
				})
			});
		}
	});
});

//     Bid.aggregate(
//         [{
//         //     $match: {
//         //         bidder: new mongoose.Schema.ObjectId(req.session.userId)
//         //     }
//         // }, {
//             $sort: {
//                 timestamp: 1
//             }
//         }, {
//             $group: {
//                 _id: {
//                     month: {
//                         $month: "$date"
//                     },
//                     day: {
//                         $dayOfMonth: "$date"
//                     },
//                     year: {
//                         $year: "$date"
//                     }
//                 },
//                 dailyBids: {
//                     $push: {
//                         title: "$title",
//                         description: "$description",
//                         id: "$_id",
//                         date: "$date"
//                     }
//                 }
//             }
//         }],
//         function(err, bids) {
//             if (err) {
//                 return next(err);
//             } else {
// 				console.log(bids);
//                 res.render('users/bids', {
//                     title: 'My bids',
//                     'bids': bids
//                 });
//             }
//         });
// });

router.get('/listings', auth, function(req, res, next) {

	Listing.find({}).populate('tags').exec(function(err, listings) {
		if (err) {
			return next(err);
		} else {
			res.render('listings/index', {
				title: 'My Listings',
				listings: listings.filter(function(listing) {
					return listing.owner == req.session.userId
				}),
				my_listings: true
			})
		}
	});
});


//     Listing.aggregate(
//         [{
//             $match: {
//                 owner: req.session.userId
//             }
//         }, {
//             $sort: {
//                 date: 1
//             }
//         }, {
//             $group: {
//                 _id: {
//                     month: {
//                         $month: "$date"
//                     },
//                     day: {
//                         $dayOfMonth: "$date"
//                     },
//                     year: {
//                         $year: "$date"
//                     }
//                 },
//                 dailyListings: {
//                     $push: {
//                         title: "$title",
//                         description: "$description",
//                         id: "$_id",
//                         date: "$date"
//                     }
//                 }
//             }
//         }],
//         function(err, listings) {
//             if (err) {
//                 return next(err);
//             } else {
//                 res.render('users/listings', {
//                     title: 'My listings',
//                     'listings': listings
//                 });
//             }
//         });
// });

router.get('/communities', auth, function(req, res) {
	User
		.findOne({
			_id: req.session.userId
		})
		.populate('communities')
		.exec(function(err, user) {
			res.render('users/communities', {
				title: 'My communities',
				'user': user
			});
		});
});

/*
POST /users/join/:communityId
req body: keyword [String]
Response:
	- success: true if successful, false otherwise
	- err: An error message describing what went wrong if unsuccessful
	- message: a message with further instructions if necessary
*/
router.post('/join/:communityId', auth, function(req, res) { //Join a community
	communityId = req.param('communityId');
	//user = req.session.userId;
	User.findOne({
		_id: req.session.userId
	}).exec(function(err, user) {
		if (err) {
			console.error(err);
			res.status(500).json({
				success: false,
				err: 'Database error'
			}).end();
		} else if (!user) {
			console.error(err);
			res.status(404).json({
				success: false,
				err: 'User not found'
			}).end();
		} else {
			if (user.communities.indexOf(communityId) != -1) {
				Community.findOne({
					_id: communityId
				}, function(err, community) {
					if (err) {
						res.status(500).send({
							msg: 'community not found'
						});
					} else {
						res.status(403);
						res.render('communities/join', {
							title: community.name,
							email: user.email,
							community: community,
							err: 'You are already a member'
						});
					}
				});
			} else {
				Community.findOne({
					_id: communityId
				}).exec(function(err, community) {
					if (err) {
						console.error(err);
						res.status(500).json({
							success: false,
							err: 'Database error'
						}).end();
					} else if (!community) {
						console.error(err);
						res.status(404).json({
							success: false,
							err: 'Community not found'
						}).end();
					} else {
						// if email verification required for community
						if (community.verifyEmail) {
							// get user email domain
							var eDomain = user.email.match(/[^@]+$/);

							console.log(community.keyword);
							console.log(user.email);
							console.log(eDomain[0]);
							if (community.keyword === eDomain[0]) {

								var base_url = 'http://' + req.headers.host;
								sendCommVerification(base_url, user, community, res, function(result) {
									if (result.success) {
										res.status(201);
										res.render('communities/success', {
											title: 'Communities',
											success: true,
											message: result.success
										});
									} else {
										res.send({
											'msg': result.error
										});
									}
								});

							} else {
								res.status(403);
								res.render('communities/join', {
									title: community.name,
									email: user.email,
									community: community,
									err: "You must have a '" + community.keyword + "' email address to join."
								});
							}


							// keyword verification check
						} else if (!(new RegExp(community.keyword).test(req.body.keyword))) {
							res.status(403);
							res.render('communities/join', {
								title: community.name,
								email: user.email,
								community: community,
								err: 'Invalid keyword'
							});
							// keyword matches, user joins community
						} else {
							user.communities.push(communityId);
							user.save(function(err, user) {
								res.status(200).render('communities/success', {
									title: 'Communities',
									success: true,
									message: 'Successfully joined ' + community.name
								});
							});
						}
					}
				});
			}
		}
	});
});

/* Delete the currently logged-in user
DELETE /users/
Response:
	- success
	- name: user's name if successful
	- err: error if unsuccessful
*/
router.delete('/', auth, function(req, res) {
	User.findByIdAndRemove(req.session.userId, function(err, user) {
		if (err) {
			res.status(404).json({
				success: false,
				err: 'User not found'
			}).end();
		} else {
			res.status(200).json({
				success: true,
				name: user.name
			}).end();
		}
	});
});

/* Log in a user
POST /users/login
req body: name, password
Response:
	- err: An error message describing what went wrong if unsuccessful
	- id: user's id if logged in successfullly
	- success
Side effects: cookie is updated to reflect logged-in status if successful
*/
router.post('/login', function(req, res) {
	console.log('session: ' + req.session);
	if (isLoggedInOrInvalidBody(req, res)) {
		return;
	}
	console.log('logging in ' + req.body.name);
	User
		.findOne({
			name: req.body.name
		})
		.populate('communities')
		.exec(function(err, user) {
			// console.log('error! ' + err);
			if (user && user.password === req.body.password) {
				req.session.userId = user._id;
				req.session.userName = user.name;
				req.session.communities = user.communities;
				console.log('login successful ' + req.session.userId);
				res.redirect('home');
			} else {
				res.render('users/login', {
					title: 'Log in to College Bazaar',
					success: false,
					err: 'Username or password incorrect'
				});
			}
		});
});

/* Log out a user [modified from example code cited above]
POST /users/logout
Response: err: an error message describing what went wrong if unsuccessful
Side effects: cookie is updated to reflect logged-out status
*/
router.post('/logout', auth, function(req, res) {
	console.log('session: ' + req.session);
	if (req.session.userId) {
		delete req.session.userId;
		delete req.session.userName;
		delete req.session.communities;
		req.session.loggedin = false;
		res.status(200).json({}).end();
	} else {
		res.status(403).json({
			err: 'There is no user currently logged in.'
		}).end();
	}
});

/* Verify a user's access to a community
POST /users/verify/community:/:key
Response: 	err: an error message describing what went wrong if unsuccessful
			success
Side effects: Verify document is removed, community is added to user's communities
*/
router.get('/verify/:community/:key/', auth, function(req, res) {
	var secret = req.param('key');
	var communityId = req.param('community');
	Verify.findByIdAndRemove(secret, function(error, verify) {
		if (error) {
			res.status(500).json({
				success: false,
				err: error
			})
		} else {
			User.findById(req.session.userId).exec(function(err, user) {
				if (err) {
					res.status(500).json({
						success: false,
						err: 'unable to find user'
					})
				} else {
					user.communities.push(communityId);
					user.save(function(err, user) {
						res.status(200).render('communities/success', {
							title: 'Communities',
							success: true,
							message: 'Verification successful'
						});
					});
				}
			});
		}
	});
});

var sendCommVerification = function(base_url, user, community, res, callback) {

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

	var secret = new Verify();
	secret.user = user._id;
	secret.community = community._id;
	secret.save(function(err, secret) {
		console.log('in secret save');


		app.mailer.send('../views/emails/verify.ejs', {
			to: user.email,
			subject: 'Verify membership in ' + community.name + ' community',
			user: user.name,
			community: community.name,
			verifyURL: base_url + '/users/verify/' + community._id + '/' + secret._id
		}, function(err) {
			console.log('in mailer after function');
			if (err) {
				console.log(err);
				callback({
					error: 'There was a problem sending the email.'
				});
				/*
				res.send({'msg': 'There was a problem sending the email.'});
				return;
				*/
			} else {
				console.log('email sent');
				callback({
					success: 'Email verification sent'
				});
			}
			return;
		});
		/*
		res.status(201);
		res.render('communities/success', {
			title: 'Communities',
			success: true,
			message: 'Email verification sent'
		});
		*/

	});
};

module.exports = router;

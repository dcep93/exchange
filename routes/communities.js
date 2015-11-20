var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = require('../model/user').User;
var Community = require('../model/community');
var auth = require('../auth');


/*
POST /communities/
req body: name, keyword, verifyEmail
Response:
	- success: true if successful, false otherwise
	- err: An error message describing what went wrong if unsuccessful,
	- message: a confirmation message if successful
	- id: if successful, the ID of the newly created community
*/
router.post('/', auth, function (req, res) {



    // Info
    var newName = req.body.name;
    var newKey = req.body.keyword;
    var toVerify = false;
    if (req.body.verifyEmail) {
        toVerify = true;
    }

    Community.findOne({
        name: newName
    }, function (err, community) {
        if (err) {
            console.error(err);
            res.status(500).json({
                success: false,
                err: 'Database error'
            }).end();
        } else {
            //check name
            if (community) {
                res.status(403).json({
                    success: false,
                    err: 'A community with this name already exists'
                }).end();
            } else {
                var newComm = new Community({
                    name: newName,
                    keyword: newKey,
                    verifyEmail: toVerify
                });

                newComm.save(function (err) {
                    if (err) {
                        console.error(err);
                        res.status(500).json({
                            success: false,
                            err: 'Database error'
                        }).end();
                    } else {
                        res.redirect('/communities');
                    }
                });
            }
        }
    });
});


router.get('/new', function(req, res) {
    res.render('communities/new', {
        title: 'Add New Community'
    });
});

/* Delete a community
DELETE /communities/
req body: id
Response:
	- name: community's name if successful
	- err: error if unsuccessful
*/
router.delete('/', auth, function (req, res) {
    Community.findByIdAndRemove(req.body.ID, function (err, community) {
        if (err) {
            res.status(404).json({
                success: false,
                err: 'Community not found'
            }).end();
        } else {
            res.status(200).json({
                success: true,
                name: community.name
            }).end();
        }
    });
});
/*
router.get('/', function(req, res) {
    //returns a list of all communities and their public information (username, etc.)
    User.find({}).populate().exec(function(err, users) {
        if (err) {
            console.error(err);
            res.status(500).json({
                success: false,
                err: 'Database error'
            }).end();
        } else {
            sendData = Array()
            for (var i = 0; i < users.length; i++) {
                userName = users[i].name;
                communities = users[i].communities;
                sendData[i] = [userName, communities];
            }
            res.status(200).json({
                success: true,
                users: sendData
            }).end();
        }
    });
});*/

router.get('/join/:communityId', auth, function(req, res){
    Community.findById(req.param('communityId'), function(err, community) {
        console.error(err);
        console.log('found community '+community.name)
				User.findById(req.session.userId, function(err, user) {
					if (err) {
						res.status(500).send({'msg': 'Cannot find logged in user.'});
					} else {
						console.log(community.name);
						console.log(community.keyword);
						console.log(community.verifyEmail);
        		res.render('communities/join', {title: community.name, email: user.email, community: community, err: err})
					}
				});
    })
});

/* Get a list of communities
Request body: nothing
Response:
- err: error text if something goes wrong
- communities: a list of commmunity objects 
*/

router.get('/', function(req, res) {
    //returns a list of all communities
    Community.find({}).exec(function(err, communities) {
        if (err) {
            console.error(err);
            res.status(500).json({
                success: false,
                err: 'Database error'
            }).end();
        } else {
            res.render('communities/list', {
                title: 'Communities',
                communities: communities
            });
        }
    });
});



module.exports = router;

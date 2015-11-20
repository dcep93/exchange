var express = require('express');
var router = express.Router();
var schemas = require('../model/listing');
var daysAgo = require('../utils').daysAgo;


// GET search through listings
router.get('/', function(req, res, next) {


	schemas.Listing
		.find({})
		.populate('owner tags')
		.exec(function(err, listings){

		if (err){
			return next(err);
		}

		else{

			var query = req.query.query.toLowerCase();
			var matching = listings.filter(function(listing){
				if(listing.title.toLowerCase().indexOf(query) > -1){
					return true;
				}
				
				// if(listing.location.toLowerCase().indexOf(query) > -1){
				// 	return true;
				// }

				if(listing.description.toLowerCase().indexOf(query) > -1){
					return true;
				}
				if(listing.owner.name.toLowerCase().indexOf(query) > -1){
					return true;
				}
				if(listing.tags) {
					if(listing.tags.filter(function(tag){
							return tag.name.toLowerCase().indexOf(query) > -1;
						}).length>0){
						return true;
					}
				}
				return false;
			});
			console.log(matching);
			
			// get number of days ago listed
			var now = new Date(Date.now());
			matching.forEach(function(match) {
				match.days = daysAgo(Math.round((now - match.date) / (1000 * 60 * 60 * 24), 0));
			});

			res.render('listings/search', {title: "Search Listings", type: 'search', search: query, listings: matching});
		}
	})
});

module.exports = router;

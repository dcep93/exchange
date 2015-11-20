var mongoose = require('mongoose');

var bidSchema = new mongoose.Schema({
	bidder: {type: mongoose.Schema.ObjectId, ref: 'User'},
	listing: {type: mongoose.Schema.ObjectId, ref: 'Listing'},
	description: {type: String, required: true},
	timestamp: {type: Date, default: Date.now}
});

var Bid = mongoose.model('Bid', bidSchema);

exports.Bid = Bid;

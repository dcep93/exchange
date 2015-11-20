var mongoose = require('mongoose');

var subscriptionSchema = new mongoose.Schema({
	subscribed: {type: mongoose.Schema.ObjectId, ref: 'Tag', index: true},
	subscribers: [{type: mongoose.Schema.ObjectId, ref: 'User'}],
	updated: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Subscription', subscriptionSchema);

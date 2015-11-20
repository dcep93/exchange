var mongoose = require('mongoose');

var notificationSchema = new mongoose.Schema({
	user: {type: mongoose.Schema.ObjectId, ref: 'User', index: true},
	subscribed: {type: mongoose.Schema.ObjectId, ref: 'Tag'},
	unread: {type: Number}
});

/*
var notificationSchema = new mongoose.Schema({
	user: {type: mongoose.Schema.ObjectId, ref: 'User'},
	subscription: [{
		subscribed: {type: mongoose.Schema.ObjectId, ref: 'Tag'},
		unread: {type: Number}
	}]
});
*/

module.exports = mongoose.model('Notification', notificationSchema);

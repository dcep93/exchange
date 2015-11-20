var mongoose = require('mongoose');

var messageSchema = new mongoose.Schema({
  sender: {type: mongoose.Schema.ObjectId, ref: 'User'},
  bid: {type: mongoose.Schema.ObjectId, ref: 'Bid'},
  content: {type: String, required: true},
  timestamp: {type: Date, default: Date.now}
});

var Message = mongoose.model('Message', messageSchema);

exports.Message = Message;

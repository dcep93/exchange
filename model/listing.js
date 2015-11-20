var mongoose = require('mongoose');

//Defining Schemas
var tagSchema = mongoose.Schema({
  name: String,
});


var listingSchema = mongoose.Schema({
  title: String,
  type: Number, //0 = For Sale; 1 = Request
  owner: {type: mongoose.Schema.ObjectId, ref: 'User'},
  tags: [{type: String, ref: 'Tag'}],
  date: {type: Date, default: Date.now},
  // location: String,
  description: String,
  price: String,
  images: [String],
});


var Tag = mongoose.model('Tag', tagSchema);
var Listing = mongoose.model('Listing', listingSchema);

exports.Tag = Tag;
exports.Listing = Listing;

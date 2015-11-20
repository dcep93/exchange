var mongoose = require('mongoose');

var commSchema = new mongoose.Schema({
		name: {type: String, required: true}, //Community's name
    keyword: {type: String, required: true}, //Regex for keyword validation
    verifyEmail: Boolean //True if keyword should be an email that must be verified in addition to being validated
    //if this is true, the user cannot join the community until their email is verified
});

module.exports = mongoose.model('Community', commSchema);

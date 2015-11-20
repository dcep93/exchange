var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    name: String,
    password: String,
    email: String,
    communities: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Community'
        }] //communities the user belongs to
});

var verifySchema = new mongoose.Schema({ //Represents a verification - this object's ID is the secret key which must be confirmed
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    Community: {
        type: mongoose.Schema.ObjectId,
        ref: 'Community'
    }
});

var User = mongoose.model('User', userSchema);
var Verify = mongoose.model('Verify', verifySchema);

exports.User = User;
exports.Verify = Verify;
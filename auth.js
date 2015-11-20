// Middleware function to check if user is logged in. If not, send response with options to login or go home
module.exports = function(req, res, next) {
	if (req.session.userId) {
		next();
	} else {
		// res.status(401).send({msg: 'You need to log in.'});
		res.redirect('/users/login');
	}
}

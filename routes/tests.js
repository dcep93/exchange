var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	req.session.userId = "testID";
	res.render('tests');
});

module.exports = router;

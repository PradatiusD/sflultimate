var keystone = require('keystone');

module.exports = function(req, res) {
	
	var view = new keystone.View(req, res);
	var locals = res.locals;
	
	// Set locals
	locals.section  = 'register';
	locals.formData = {};

	view.on('post', function (next) {

		for (var p in req.body) {
			locals.formData[p] = req.body[p];
		}
		next();
	});
	
	// Render the view
	view.render('register');
	
};

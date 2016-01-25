var keystone = require("keystone");

module.exports = function(req, res) {
  
  var view = new keystone.View(req, res);

  var referer = req.headers.referer;

  if (!referer) {
    return view.render('errors/500');    
  }

  // Validate if last 7 characters of HTTP referrer are /register
  var last7referrerChars = referer.substring(referer.length - "/register".length, referer.length);
  var referedFromRegistration = last7referrerChars === "/register";

  if (referedFromRegistration) {
    view.render('confirmation');    
  } else {
    view.render('errors/500');
  }
};

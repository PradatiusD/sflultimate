const keystone = require("keystone");

module.exports = function(req, res) {
  
  const view = new keystone.View(req, res);

  const referer = req.headers.referer;

  if (!referer) {
    return view.render("errors/500");    
  }

  // Validate if last 7 characters of HTTP referrer are /register
  const last7referrerChars = referer.substring(referer.length - "/register".length, referer.length);
  const referedFromRegistration = last7referrerChars === "/register";

  if (referedFromRegistration) {
    view.render("confirmation");    
  } else {
    view.render("errors/500");
  }
};

var keystone  = require("keystone");
var braintree = require("braintree");

var gateway = braintree.connect({
  environment: braintree.Environment.Sandbox,
  merchantId:  process.env.BRAINTREE_MERCHANT_ID,
  publicKey:   process.env.BRAINTREE_PUBLIC_KEY,
  privateKey:  process.env.BRAINTREE_PRIVATE_KEY
});


module.exports = function(req, res) {
  
  var view = new keystone.View(req, res);
  var locals = res.locals;

  // Get Braintree Token
  view.on('init', function (next) {

    gateway.clientToken.generate({}, function (err, response) {

      if (err || !response.clientToken) {
        console.log(err); throw err;
      }
      locals.braintree_token = response.clientToken;
      next();
    });
  });

  locals.section  = 'register';
  locals.formData = {};

  view.on('post', function (next) {

    for (var p in req.body) {
      locals.formData[p] = req.body[p];
    }

    var leagueFee = (req.body.age === "student") ? "30.00": "50.00";

    var purchase = {
      amount: leagueFee,
      paymentMethodNonce: req.body.payment_method_nonce
    };
    
    gateway.transaction.sale(purchase, function (err, result) {

      console.log(req.body);
      console.log(result);

      if (result.success) {
        // On success
        // 1. State that the user has paid
        // 2. Record their desired partner id
        // 3. Save their updated form data
        return res.redirect("/confirmation");
      }

      next();
    });
  });



  
  // Render the view
  view.render('register');
  
};

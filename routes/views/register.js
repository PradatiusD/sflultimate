var keystone  = require("keystone");
var braintree = require("braintree");
var Player    = keystone.list("Player");

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

    var player = Player.model.findById(req.body.user_id).exec(function (err, player) {

      if (player.registered) {
        locals.err = "You are already registered.";
        return next();
      }

      var purchase = {
        amount: leagueFee,
        paymentMethodNonce: req.body.payment_method_nonce
      };

      gateway.transaction.sale(purchase, function (err, result) {

        if (err) {
          locals.err = err;
          return next();
        }

        if (!result.success) {
          locals.err = JSON.stringify(result);
          return next();
        }

        console.log(req.body);
        console.log(result);

        if (result.success) {

          player.registered = true;

          if (req.body.partner_id) {
            player.partner_id = req.body.partner_id;
          }

          player.save(function (err) {
            if (err) throw err;
            return res.redirect("/confirmation");
          });
        } else {
          next();
        }

      });

    });
  });
  
  // Render the view
  view.render('register');
};

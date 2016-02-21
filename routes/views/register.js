var keystone  = require("keystone");
var braintree = require("braintree");
var Player    = keystone.list("Player");
var _         = require("underscore");

var gateway = braintree.connect({
  environment: braintree.Environment[process.env.BRAINTREE_ENV],
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

    var leagueFee = (req.body.age === 'Student') ? '65.00': '65.00';

    // var leagueFee = (req.body.age === 'Student') ? '30.00': '50.00';

    var player = Player.model.findById(req.body.user_id).exec(function (err, player) {

      if (_.isUndefined(player)) {
        player = {};
      }

      if (player.registered) {
        locals.err = "You are already registered.";
        return next();
      }

      var purchase = {
        amount: leagueFee,
        paymentMethodNonce: req.body.payment_method_nonce,
        options: {
          submitForSettlement: true
        },
        customer: {
          firstName: req.body['name.first'],
          lastName:  req.body['name.last'],
          email:     req.body.email,
        },
        customFields: {
          partner:       req.body.partner,
          partner_id:    req.body.partner_id,
          age:           req.body.age,
          shirt_size:    req.body.shirtSize,
          skill_level:   req.body.skillLevel,
          participation: req.body.participation
        }
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

        if (result.success) {

          if (_.isEmpty(player)) {
            player = new Player.model({
              name: {
                first:  req.body['name.first'],
                last:   req.body['name.last']
              },
              email:         req.body.email,
              password:      req.body['name.first'].substring(0,1)+req.body['name.last'],
              shirtSize:     req.body.shirtSize,
              skillLevel:    req.body.skillLevel,
              participation: req.body.participation,
              ageGroup:      req.body.age,
              registered:    true
            });
          } else {

            player.registered    = true;
            player.participation = req.body.participation;
            player.ageGroup      = req.body.age;
            player.shirtSize     = req.body.shirtSize;
            player.skillLevel    = req.body.skillLevel;
          }

          if (req.body.partner_id) {
            player.partner = req.body.partner_id;
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

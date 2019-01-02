const keystone  = require("keystone");
const braintree = require("braintree");
const HatterPlayer = keystone.list("HatterPlayer");
const _ = require("underscore");

const braintreeAccount = {
    environment: braintree.Environment[process.env.BRAINTREE_ENV],
    merchantId:  process.env.BRAINTREE_MERCHANT_ID,
    publicKey:   process.env.BRAINTREE_PUBLIC_KEY,
    privateKey:  process.env.BRAINTREE_PRIVATE_KEY
};


const gateway = braintree.connect(braintreeAccount);

module.exports = function(req, res) {

    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Get Braintree Token
    view.on("init", function (next) {

        gateway.clientToken.generate({}, function (err, response) {

            if (err || !response.clientToken) {
                console.log(err);
                throw err;
            }
            locals.braintree_token = response.clientToken;
            next();
        });
    });

    locals.section  = "register";
    locals.formData = {};

    view.on("post", function (next) {

        if (!req.body.registration_dates) {
            locals.err = "Please pick at least one registration date";
            return next();
        }
        
        let amount;
        
        const datesForForm = _.isArray(req.body.registration_dates) ? req.body.registration_dates.length : req.body.registration_dates.split(',').length;
        
        switch (datesForForm) {
            case 1:
                amount = 20;
                break;
            case 2:
                amount = 40;
                break;
            case 3:
                amount = 50;
                break;
        }
        
        const purchase = {
            amount: amount,
            paymentMethodNonce: req.body.payment_method_nonce,
            options: {
                submitForSettlement: true
            },
            customer: {
                firstName: req.body.first_name,
                lastName: req.body.last_name,
                email: req.body.email,
            },
            customFields: {
                partner: req.body.partner_name,
                gender: req.body.gender,
                skill_level: req.body.skillLevel,
                participation: req.body.registration_dates
            }
        };
        
        gateway.transaction.sale(purchase, (err, result) => {

            if (err) {
                locals.err = err;
                console.log(err);
                return next();
            }

            if (!result.success) {
                console.log(JSON.stringify(locals.err, null, 2));
                locals.err = JSON.stringify(result);
                return next();
            }

            const player = new HatterPlayer.model({
                name: {
                    first: req.body.first_name,
                    last: req.body.last_name
                },
                email: req.body.email,
                partners: req.body.partner_name,
                gender: req.body.gender,
                skillLevel: req.body.skillLevel,
                dates_registered: req.body.registration_dates,
                comments: req.body.comments || ""
            });

            player.save((err) => {
                if (err) {
                    locals.err = err;
                    console.log(err);
                    return next();
                }

                res.redirect("/confirmation");
            });
        });
    });

    // Render the view
    view.render("register");
};

braintree.setup(clientToken, 'dropin', {
  container: 'payment-form'
});

(function ($) {
  grecaptcha.ready(function () {
    grecaptcha.execute('6Ld6rNQUAAAAAAthlbLL1eCF9NGKfP8-mQOHu89w', { action: 'register' }).then(function (token) {
      $('#recaptcha').val(token)
    })
  })
})(jQuery);

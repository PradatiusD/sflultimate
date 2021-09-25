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

(function ($) {
  const registrationCheckboxes = $('#registration_dates input')

  registrationCheckboxes.change(function () {
    let datesPicked = 0

    registrationCheckboxes.each(function () {
      if ($(this).is(':checked')) {
        datesPicked += 1
      }
    })

    const $totalCost = $('#total_cost')

    switch (datesPicked) {
      case 0:
        $totalCost.text('N/A, please pick a date')
        break
      case 1:
        $totalCost.text('$20.00')
        break
      case 2:
        $totalCost.text('$30.00')
        break
    }
  })
})(jQuery)

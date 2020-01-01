braintree.setup(clientToken, 'dropin', {
  container: 'payment-form'
});

(function ($) {
  var registrationCheckboxes = $('#registration_dates input')

  registrationCheckboxes.change(function () {
    var datesPicked = 0

    registrationCheckboxes.each(function () {
      if ($(this).is(':checked')) {
        datesPicked += 1
      }
    })

    var $totalCost = $('#total_cost')

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

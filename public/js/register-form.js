(function ($) {
  document.querySelector('#submitButton').addEventListener('click', function (e) {
    const hasAtLeastOnePlayerPositionChecked = Array.from(document.querySelectorAll('input[name="preferredPositions"]')).find(function (item) {
      return item.checked
    })
    if (!hasAtLeastOnePlayerPositionChecked) {
      e.preventDefault()
      e.stopPropagation()
      const $playerPositionDivs = document.getElementById('playerPositions').offsetTop
      window.scrollTo({ top: $playerPositionDivs, behavior: 'smooth' })
      document.getElementById('playerPositionError').style.display = 'block'
      return false
    }
    return true
  }, {
    capture: true
  })
  braintree.setup(clientToken, 'dropin', {
    container: 'payment-form'
  })

  window.grecaptcha.ready(function () {
    window.grecaptcha.execute('6Ld6rNQUAAAAAAthlbLL1eCF9NGKfP8-mQOHu89w', { action: 'register' }).then(function (token) {
      $('#recaptcha').val(token)
    })
  })
})(window.jQuery)

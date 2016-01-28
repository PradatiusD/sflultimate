braintree.setup(clientToken, "dropin", {
  container: "payment-form"
});

(function ($) {
  $.get('/players', function (playerData) {

  	playerData = playerData.map(function (d){
  		d.name = d.full_name.first +" "+d.full_name.last;
  		return d;
  	});

  	$("#firstName").typeahead({
  		source: playerData,
  		afterSelect: function (d) {
  			$("#firstName").val(d.full_name.first);
  			$("#lastName").val(d.full_name.last);
  			$("#email").val(d.email);
  			$("#user_id").val(d.id);
        $("#shirtSize").val(d.size);
        $("#skillLevel").val(d.skill);
  		}
  	})

    $("#partner").typeahead({
      source: playerData,
      afterSelect: function (d) {
        $('#partner_id').val(d.id);
      }
    });
  });
})(jQuery);
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
        var updates = [
          {
            id: "#firstName",
            value: d.full_name.first,
          },{
            id: "#lastName",
            value: d.full_name.last
          },{
            id: "#email",
            value: d.email
          },{
            id: "#user_id",
            value: d.id
          },{
            id: "#shirtSize",
            value: d.size
          },{
            id: "#skillLevel",
            value: d.skill
          },{
            id: "#age",
            value: d.age || "Adult"
          },{
            id: "#participation",
            value: d.participation || "80"
          }
        ];

        updates.forEach(function (update) {

          if (update.id === "#age") {
            $("#age").find('input').each(function () {
              if (update.value === $(this).val()) {
                $(this).attr('checked','');
              }
            });
          } else {
            $(update.id).val(update.value);          
          }

        });
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
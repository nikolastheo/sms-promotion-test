
    function attachSubmitEvent() {
        $("#submit").click(function() {
            sendPromoRequest();
        });
    }

    function sendPromoRequest() {
        $('#promo-code-form').validator('validate');
        var phone = $("#country-codes").val() + $("#input-tel").val();
        $.getJSON("/api/sms-promotion", {
            phone: phone
        }, function(data) {
            if (data.status == "Error") {
                $("#message-placeholder").empty().append('<div class="alert alert-danger" role="alert"> <span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> <span class="sr-only">Error:</span>' + data.message + '</div>');
            } else {
                $("#message-placeholder").empty().append('<div class="alert alert-success" role="alert"> <span class="glyphicon glyphicon glyphicon-ok" aria-hidden="true"></span> <span class="sr-only">Success:</span>' + data.message + '</div>');

            }
        });

    }

    function createValidations() {
        $('#promo-code-form').validator();
        $("#input-tel").change(function() {
            if ($("#country-codes").val() == "")
                $("#country-codes").trigger('input');
        });
    }

    function createCountryCodes() {
        var result = false;
        $.getJSON("/TelephoneCodes", function(data) {
            var html = '<select class="form-control has-error has-feedback" id="country-codes" placeholder="Telephone Country Code" data-error="Please select a value!" required><option value="" >Select Telephone Code By Country</option>';
            $.each(data["countries"], function(index, value) {
                html += '<option value="' + value["code"] + '">' + value["name"] + ' (' + value["code"] + ')</option>';
            })
            html += "</select>";
            $("#country-codes-container").append(html);
            $('#promo-code-form').validator('update')
            result = true;
        }).fail(function() {
            console.log("error! /TelephoneCodes ");
        });
        return result;
    }
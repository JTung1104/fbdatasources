(function(){
  freeboard.addStyle('table.list-table', "width: 100%; white-space: normal !important; ");
  freeboard.addStyle('table.tablescroll_head', "width:279px!important;border-collapse: collapse;");
  freeboard.addStyle('table.tablescroll_head th', " font-size: 11px;");
  freeboard.addStyle('table.tablescroll_body', " 276px!important;");
  freeboard.addStyle('table.tablescroll_body .td-0', " width:106px!important;");
  freeboard.addStyle('table.tablescroll_body .td-1', " width:60%!important;");
  freeboard.addStyle('table.tablescroll_body .td-2', " width:40%!important;text-align:right;");
  freeboard.addStyle('table.tablescroll_wrapper', " width:280px!important;");
  freeboard.addStyle('.added-header', "background: #CFCCCB;");
  freeboard.addStyle('table.list-table thead', "background: #CFCCCB;");
  freeboard.addStyle('table.list-table tr', "display: table-row; vertical-align: inherit; border-color: inherit;");
  freeboard.addStyle('table.list-table tr.highlight', "background-color:#656565; color:#FFFFFF");
  freeboard.addStyle('table.list-table th', "padding: .3em; border: 2px #545454 solid; font-size: 11px;");
  freeboard.addStyle('table.list-table tbody', "display: table-row-group;  vertical-align: middle; border-color: inherit;");
  freeboard.addStyle('table.list-table td, table.list-table th', "padding: .3em; font-size: 12px; ");
  freeboard.addStyle('table.list-table td, table.list-table th', "padding: 2px 2px 2px 2px; vertical-align: top; ");
  freeboard.addStyle('table.tablescroll_head th', "padding: 2px 2px 2px 2px; vertical-align: top; ");

  var notificationsWidget = function (settings) {
    var self = this;
    var titleElement = $('<h2 class="section-title"></h2>');
    var stateElement = $('<div><table class="list-table"><thead/></table></div>');
    var currentSettings = settings;
		var stateObject = {};

    var sendSMS = function (message) {
      if (currentSettings.sms_notifications && currentSettings.phone_numbers.length > 0) {
        var phoneNumbers = currentSettings.phone_numbers;

        phoneNumbers.forEach(function (phoneNumber) {
          if (phoneNumber.phone_number.length === 9) {phoneNumber.phone_number = "1" + phoneNumber.phone_number;}

          $.ajax({
            type: "POST",
            url: "https://globeowl-twilio.herokuapp.com/alert/+" + phoneNumber.phone_number,
            data: {
              message: message
            },
            success: function (payload) {
              console.log(payload);
            },
            dataType: "JSON"
          });
        });
      }
    };

    var sendEmail = function (message) {
      if (currentSettings.email_notifications && currentSettings.emails.length > 0) {
        var emails = currentSettings.emails;

        emails.forEach(function (email) {
          $.ajax({
            type: "POST",
            url: "https://globeowl-twilio.herokuapp.com/alert/email/" + email.email,
            data: {
              message: message
            },
            success: function (payload) {
              console.log(payload);
            },
            dataType: "JSON"
          });
        });
      }
    };

		function updateState() {
			var bodyHTML = $('<tbody/>');
			var classObject = {};
			var classCounter = 0;

	    var replaceValue = (_.isUndefined(currentSettings.replace_value) ? '' : currentSettings.replace_value);

			//only proceed if we have a valid JSON object
			if (stateObject.value) {
				var headerRow = $('<tr class="added-header"/>');
				var rowHTML = $('<tr/>').click(function() { $(this).remove();}).hover(function() {
                      $(this).addClass('highlight');
                   }, function() {
                      $(this).removeClass('highlight');
                   });
				try {
            var value = (typeof currentSettings.units === "undefined") ? stateObject.value : (stateObject.value + " " + currentSettings.units);
						classObject[stateObject.header] = 'td-' + classCounter;
						headerRow.append($('<th/>').addClass('td-'+0).html("Message"));
						headerRow.append($('<th/>').addClass('td-'+1).html((stateObject.header) ? stateObject.header:"Timestamp"));
						rowHTML.append($('<td/>').addClass('td-' + 1).html(value)).append($('<td class="td-2"></td>').append($('<time class="timeago" datetime="'+(new Date()).toISOString()+'">moments ago</time>').timeago()));
						bodyHTML.append(rowHTML);
				} catch (e) {
					console.log(e);
				}
				//Append the header and body
        if(stateElement.find('.added-header').length > 0){
        }else{
        	// stateElement.find('thead').append(timestampRow);
				  stateElement.find('thead').append(headerRow);
        }
          stateElement.find('.list-table').prepend(bodyHTML);
          if($(stateElement).find('.list-table').hasClass('tablescroll_head')){
          }else{
              $(stateElement).find('.list-table').tableScroll({height:200});
          }
				//show or hide the header based on the setting
				if (currentSettings.show_header) {
					stateElement.find('thead').show();
				} else {
					stateElement.find('thead').hide();
				}

			  }
        }

        this.render = function (element) {
            $(element).append(titleElement).append(stateElement);
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
            updateState();
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
          if (currentSettings.alert_points.length > 0) {
            var alertPoints = currentSettings.alert_points.sort(function (a, b) {
              return b.alert_point - a.alert_point; // sort descending because you only want the alert to trigger once
            });

            var alreadyAlerted = false;

            alertPoints.forEach(function(alertPoint) {
              if (alreadyAlerted === false) {
                if (newValue >= alertPoint.alert_point) {
                  stateObject[settingName] = newValue;
                  var message = (typeof currentSettings.units === "undefined") ? `${currentSettings.title} has reached a value of ${newValue} which is greater than the ${alertPoint.alert_point} alert point!`
                  : `${currentSettings.title} has reached a value of ${newValue} ${currentSettings.units} which is greater than the ${alertPoint.alert_point} ${currentSettings.units} alert point!`
                  sendSMS(message);
                  alreadyAlerted = true;
                  updateState();
                }
              }
            });
          }
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
			    var height = Math.ceil(stateElement.height() / 50);
          height = 2;
			    return (height > 0 ? height : 3);
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "notifications",
        display_name: "Notifications",
        hide: true,
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
			      {
                name: "show_header",
                display_name: "Show Headers",
				        default_value: true,
                type: "boolean"
            },
			      {
                name: "value",
                display_name: "Value",
                type: "calculated",
            },
            {
                name: "units",
                display_name: "Units",
                type: "text"
            },
            {
              name: "alert_points",
              display_name: "Alert Points",
              type: "array",
              description: "You will only receive notifications for values greater than or equal to any alert points you set.",
              settings: [
                {
                  name: "alert_point",
                  display_name: "Alert Point",
                  type: "number"
                }
              ]
            },
            {
              name: "sms_notifications",
              display_name: "SMS Notifications",
              default_value: false,
              type: "boolean",
              description: "You will receive SMS notifications at the phone numbers you input."
            },
            {
              name: "phone_numbers",
              display_name: "Phone Numbers",
              type: "array",
              description: "Please include country code and remove all symbols. e.g. 12223334444",
              settings: [
                {
                  name: "phone_number",
                  display_name: "Phone Number",
                  type: "text"
                }
              ]
            },
            {
              name: "email_notifications",
              display_name: "Email Notifications",
              default_value: false,
              type: "boolean",
              description: "You will receive Email notifications at the email addresses you input."
            },
            {
              name: "emails",
              display_name: "Emails",
              type: "array",
              settings: [
                {
                  name: "email",
                  display_name: "Email",
                  type: "text"
                }
              ]
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new notificationsWidget(settings));
        }
    });
}());

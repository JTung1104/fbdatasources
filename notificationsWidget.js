(function()
{
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
						classObject[stateObject.header] = 'td-' + classCounter;
						headerRow.append($('<th/>').addClass('td-'+0).html("Message"));
						headerRow.append($('<th/>').addClass('td-'+1).html((stateObject.header) ? stateObject.header:"Timestamp"));
						rowHTML.append($('<td/>').addClass('td-' + 1).html(stateObject.value)).append($('<td class="td-2"></td>').append($('<time class="timeago" datetime="'+(new Date()).toISOString()+'">moments ago</time>').timeago()));
						bodyHTML.append(rowHTML);
				} catch (e) {
					console.log(e);
				}
				//Append the header and body
                if(stateElement.find('.added-header').length > 0){
                }else{
        		//stateElement.find('thead').append(timestampRow);
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
			stateObject[settingName] = newValue;
            updateState();
        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
			var height = Math.ceil(stateElement.height() / 50);
            height = 4;
			return (height > 0 ? height : 3);
        }

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: "notifications",
        display_name: "Notifications",
        hide: true,
//         external_scripts : [
//          "plugins/thirdparty/jquery.tablescroll.js",
//          "plugins/thirdparty/jquery.timeago.js"
//          ],
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
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new notificationsWidget(settings));
        }
    });
}());

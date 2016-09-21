(function () {
	var phoneDatasource = function (settings, updateCallback) {
		var self = this;
		var currentSettings = settings;

    var getData = function () {
			updateCallback({});
    };

		self.updateNow = function () {
			getData();
		};

		self.onDispose = function () {
		};

		self.onSettingsChanged = function (newSettings) {
			currentSettings = newSettings;
		};
	};

	freeboard.loadDatasourcePlugin({
		"type_name": "phone",
		"display_name": "Phone Datasource",
		"external_scripts": [
			//"https://dweet.io/client/dweet.io.min.js"
		],
		"settings": [
			{
				name: "phone_number",
				display_name: "Phone Number",
				"description": "Please include country code and remove all symbols e.g. 12223334444",
				type: "text"
			}
		],
		newInstance: function (settings, newInstanceCallback, updateCallback) {
			newInstanceCallback(new phoneDatasource(settings, updateCallback));
		}
	});
}());

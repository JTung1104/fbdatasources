(function () {
  freeboard.loadDatasourcePlugin({
    type_name: "dweet_v2",
    display_name: "Dweet V2",
    settings: [
      {
        name: "thing_name",
        display_name: "Thing Name",
        type: "text"
      },
      {
        name: "read_key",
        display_name: "Read Key",
        type: "text"
      },
      {
        name: "account_token",
        display_name: "Account Token",
        type: "text"
      }
    ],
    external_scripts: ["https://www.dropbox.com/s/4r1c84tl82yg49e/dweet.io.js?dl=1"],
    newInstance: function (settings, newInstanceCallback, updateCallback) {
      newInstanceCallback(new dweetV2Datasource(settings, updateCallback));
    }
  });

  var dweetV2Datasource = function (settings, updateCallback) {
    var self = this,
        currentSettings = settings;

    function getData () {
      if (currentSettings.account_token && currentSettings.thing_name) {
        dweetio.token = currentSettings.account_token;
        dweetio.get_latest_dweet_for(currentSettings.thing_name, updateCallback);
        dweetio.listen_for(currentSettings.thing_name, currentSettings.read_key, updateCallback, currentSettings.account_token);
      }
    }

    self.onSettingsChanged = function (newSettings) {
      currentSettings = newSettings;
    };

    self.updateNow = function () {
      getData();
    };

    self.onDispose = function () {
      dweetio.stop_listening_for(currentSettings.thing_name);
    };
  };
}());

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
    external_scripts: ["https://www.dropbox.com/s/xcj6swmplobnur7/dweet.io.js?raw=1"],
    newInstance: function (settings, newInstanceCallback, updateCallback) {
      newInstanceCallback(new dweetV2Datasource(settings, updateCallback));
    }
  });

  var dweetV2Datasource = function (settings, updateCallback) {
    var self = this,
        currentSettings = settings;
        dweetio.token = currentSettings.account_token;        
        dweetio[currentSettings.thing_name] = {
          token: currentSettings.account_token,
          listening: false
        };

    function getData () {
      dweetio.token = dweetio[currentSettings[thing_name].token;
      
      if (currentSettings.account_token && currentSettings.thing_name) {
        dweetio.get_latest_dweet_for(currentSettings.thing_name, currentSettings.read_key, function (err, dweet) {
          if (err) console.log(err);
          updateCallback(dweet[0]);
        });

        if (!dweetio[currentSettings.thing_name].listening) {
          dweetio.listen_for(currentSettings.thing_name, currentSettings.read_key, function (dweet) {
            updateCallback(dweet);
          });
          
          dweetio[currentSettings.thing_name].listening = true;          
        }

      }
    }

    self.onSettingsChanged = function (newSettings) {
      dweetio.stop_listening_for(currentSettings.thing_name);
      currentSettings = newSettings;
      dweetio.listen_for(currentSettings.thing_name, currentSettings.read_key, function (dweet) {
        updateCallback(dweet);
      });
    };

    self.updateNow = function () {
      getData();
    };

    self.onDispose = function () {
      dweetio.stop_listening_for(currentSettings.thing_name);
      delete dweetio[currentSettings.thing_name];
    };
  };
}());

(function () {
  freeboard.loadDatasourcePlugin({
    type_name: "azure_iot_hub",
    display_name: "Azure IoT Hub",
    settings: [
      {
        name: "device_id",
        display_name: "Device ID",
        type: "text"
      },
      {
        name: "refresh",
        display_name: "Refresh Every",
        type: "number",
        suffix: "seconds",
        default_value: 10
      }
    ],
    newInstance: function (settings, newInstanceCallback, updateCallback) {
      newInstanceCallback(new azureDatasource(settings, updateCallback));
    }
  });

  var azureDatasource = function (settings, updateCallback) {
    var self = this,
        refreshTimer,
        currentSettings = settings;

    var getData = function () {
      $.ajax({
        type: "GET",
        url: "https://blink-data.herokuapp.com/devices/" + currentSettings.device_id,
        headers: {
          "Content-Type": "application/json"
        },
        success: function (payload) {
          if (Object.keys(payload).length === 0) {
            getData();
          } else {
            updateCallback(formatData(payload));
          }
        },
        error: function () {
          getData();
        },
        dataType: "JSON"
      });
    };

    var formatData = function (payload) {
      var newData = {
        "Payload Type #1": {
          "Payload Version": "",
          "Data": {}
        }
      };

      newData["Payload Type #1"]["Payload Version"] = payload.p1.v;

      Object.keys(payload.p1.d).forEach(function (key) {
        newData["Payload Type #1"]["Data"][translateDataField(key)] = payload.p1.d[key];
      });

      newData["Payload Type #1"]["Data"]["Last Updated"] = new Date(payload.p1.d.cdt).toLocaleString();

      return newData;
    };

    var translateDataField = function (key) {
      var translate = {
        did: "Device ID",
        gid: "Gateway ID",
        cdt: "Last Updated",
        1: "System",
        2: "Temperature",
        3: "Volume (dB)",
        4: "Humidity (%)",
        5: "In Use",
        6: "Is Open",
        7: "Battery Voltage",
        8: "Battery Level (%)",
        9: "Light Level (%)",
        10: "Light Level (lux)",
        11: "Light Level(day/night)",
        12: "Distance",
        13: "Speed",
        14: "Altitude"
      };

      return translate[key];
    };

    function createRefreshTimer (interval) {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }

      refreshTimer = setInterval(function () {
        getData();
      }, interval);
    }

    createRefreshTimer(currentSettings.refresh * 1000);

    self.onSettingsChanged = function (newSettings) {
      currentSettings = newSettings;
    };

    self.updateNow = function () {
      getData();
    };

    self.onDispose = function () {
      clearInterval(refreshTimer);
      refreshTimer = undefined;
    };
  };
}());

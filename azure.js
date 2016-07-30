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
        suffix: "minutes",
        default_value: 5
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
        url: "https://blink-data.herokuapp.com/device/" + currentSettings.device_id,
        headers: {
          "Content-Type": "application/json"
        },
        success: function (payload) {
          formatDeviceTime(payload);
          updateCallback(payload);
        },
        dataType: "JSON"
      });
    };

    var formatDeviceTime = function (device) {
      device.connectionStateUpdatedTime = new Date(device.connectionStateUpdatedTime).toLocaleString();
      device.statusUpdatedTime = new Date(device.statusUpdatedTime).toLocaleString();
      device.lastActivityTime = new Date(device.lastActivityTime).toLocaleString();
    };

    function createRefreshTimer (interval) {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }

      refreshTimer = setInterval(function () {
        getData();
      }, interval);
    }

    createRefreshTimer(currentSettings.refresh * 1000 * 60);

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

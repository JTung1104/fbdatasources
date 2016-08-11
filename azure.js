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
      newData["Payload Type #1"]["Data"] = payload.p1.d;
      newData["Payload Type #1"]["Data"]["Device ID"] = payload.p1.d.did;
      newData["Payload Type #1"]["Data"]["Gateway ID"] = payload.p1.d.gid;
      newData["Payload Type #1"]["Data"]["Time Created"] = new Date(payload.p1.d.cdt).toLocaleString();
      delete newData["Payload Type #1"]["Data"]["did"];
      delete newData["Payload Type #1"]["Data"]["gid"];
      delete newData["Payload Type #1"]["Data"]["cdt"];

      return newData;
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

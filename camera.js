(function () {
  freeboard.loadDatasourcePlugin({
    type_name: "nest",
    display_name: "Nest",
    external_scripts: ["https://cdn.firebase.com/js/client/2.4.2/firebase.js"],
    settings: [
      {
        name: "authorization_code",
        display_name: "Authorization Code",
        type: "text",
        description: "Your personal authorization code generated from <a href=\"https://home.nest.com/login/oauth2?client_id=1c018519-6992-43af-a75e-a8645cb9c82e&state=" + getCSRFtoken() + "\" target=\"_blank\">here</a>."
      },
      {
        name: "access_token",
        display_name: "Access Token",
        type: "text",
        description: "Leave this field blank."
      },
      {
        name: "refresh_time",
        display_name: "Refresh Every",
        type: "number",
        suffix: "seconds",
        default_value: 10
      }
    ],
    newInstance: function (settings, newInstanceCallback, updateCallback) {
      newInstanceCallback(new nestDatasource(settings, updateCallback));
    }
  });

  function getCSRFtoken () {
    var possibleChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012345679",
        token = "";

    for (var i = 0; i < 16; i++) {
      token += possibleChars[Math.floor(Math.random() * possibleChars.length)];
    }

    return token;
  }

  var nestDatasource = function (settings, updateCallback) {
    var self = this,
        refreshTimer,
        currentSettings = settings;

    function getAccessToken () {
      $.ajax({
        type: "POST",
        url: "https://thingproxy.freeboard.io/fetch/https://api.home.nest.com/oauth2/access_token?client_id=1c018519-6992-43af-a75e-a8645cb9c82e&code=" + currentSettings.authorization_code + "&client_secret=7bFoutPTlsTcC195UfsiZZBCQ&grant_type=authorization_code",
        data: {
          code: currentSettings.authorization_code,
          client_id: "1c018519-6992-43af-a75e-a8645cb9c82e",
          client_secret: "7bFoutPTlsTcC195UfsiZZBCQ",
          grant_type: "authorization_code"
        },
        success: function (payload) {
          currentSettings.access_token = payload.access_token;
          getData();
        },
        error: function (xhr, status, error) {
        },
        dataType: "JSON"
      });
    }

    function getData () {
      if (typeof currentSettings.access_token === "undefined") {
        getAccessToken();
      } else if (typeof self.ref === "undefined") {
        self.ref = new Firebase('wss://developer-api.nest.com');
        self.ref.authWithCustomToken(currentSettings.access_token);
        self.onValueChange = self.ref.on('value', function (snapshot) {
          var data = snapshot.val();

          var newData = {
            access_token: data.metadata.access_token,
            client_version: data.metadata.client_version
          };

          unpackDevices(data.devices, newData);
          unpackStructures(data.structures, newData);
          updateCallback(newData);
        });
      }
    }

    function unpackDevices (devices, newData) {
      Object.keys(devices).forEach(function (deviceType) {
        Object.keys(devices[deviceType]).forEach(function (device) {
          if (devices[deviceType][device].name_long) {
            newData[devices[deviceType][device].name_long] = devices[deviceType][device];
            if (deviceType === "cameras") {
              var camera = newData[devices[deviceType][device].name_long];
              camera.stream_code = camera.public_share_url.slice(camera.public_share_url.length - 6);
              formatCameraTime(camera);
            } else if (deviceType === "thermostats") {
              var thermostat = newData[devices[deviceType][device].name_long];
              formatThermostatTime(thermostat);
            } else if (deviceType === "smoke_co_alarms") {
              var alarm = newData[devices[deviceType][device].name_long];
              formatAlarmTime(alarm);
            }
          }
        });
      });
    }

    function formatAlarmTime (alarm) {
      alarm.last_connection = new Date(alarm.last_connection).toLocaleString();
      alarm.last_manual_test_time = new Date(alarm.last_manual_test_time).toLocaleString();
    }

    function formatThermostatTime (thermostat) {
      thermostat.last_connection = new Date(thermostat.last_connection).toLocaleString();
      thermostat.fan_timer_timeout = new Date(thermostat.fan_timer_timeout).toLocaleString();
    }

    function formatCameraTime (camera) {
      camera.last_is_online_change = new Date(camera.last_is_online_change).toLocaleString();
      camera.last_event.start_time = new Date(camera.last_event.start_time).toLocaleString();
      camera.last_event.end_time = new Date(camera.last_event.end_time).toLocaleString();
      camera.last_event.urls_expire_time = new Date(camera.last_event.urls_expire_time).toLocaleString();
    }

    function formatStructureTime (structure) {
      structure.peak_period_start_time = new Date(structure.peak_period_start_time).toLocaleString();
      structure.peak_period_end_time = new Date(structure.peak_period_end_time).toLocaleString();
    }

    function unpackStructures (structures, newData) {
      Object.keys(structures).forEach(function (structure) {
        if (structures[structure].name) {
          newData[structures[structure].name] = structures[structure];
          var structure = newData[structures[structure].name];
          formatStructureTime(structure);
        }
      });
    }

    var refreshTimer;

    function createRefreshTimer (interval) {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }

      refreshTimer = setInterval(function () {
        getData();
      }, interval);
    }

    self.onSettingsChanged = function (newSettings) {
      currentSettings = newSettings;
    };

    self.updateNow = function () {
      getData();
    };

    self.onDispose = function () {
      clearInterval(refreshTimer);
      refreshTimer = undefined;
      if (self.ref) {
        self.ref.off('value', self.onValueChange);
      }
    };

    createRefreshTimer(currentSettings.refresh_time * 1000);
  };

  freeboard.loadDatasourcePlugin({
    type_name: "nest_camera",
    display_name: "Nest Camera",
    settings: [
      {
        name: "stream_code",
        display_name: "Stream Code",
        type: "text",
        description: "Input the stream code from your Nest Datasource exactly as it appears (case sensitive)."
      }
    ],
    newInstance: function (settings, newInstanceCallback, updateCallback) {
      newInstanceCallback(new nestCameraDatasource(settings, updateCallback));
    }
  });

  var nestCameraDatasource = function (settings, updateCallback) {
    var self = this,
        currentSettings = settings;

    function getData () {
      var newData = {
        live_stream_html: "<iframe src=\"https://video.nest.com/embedded/live/" + currentSettings.stream_code + "\" frameborder=\"0\" width=\"100%\" height=\"100%\"></iframe>"
      }

      updateCallback(newData);
    }

    self.onSettingsChanged = function (newSettings) {
      currentSettings = newSettings;
    };

    self.updateNow = function () {
      getData();
    };

    self.onDispose = function () {
    };
  };
}());

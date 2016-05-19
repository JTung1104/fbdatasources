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
          console.log(data);

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

            if (deviceType === "cameras" && devices[deviceType][device].is_public_share_enabled) {
              var camera = newData[devices[deviceType][device].name_long];
              camera.live_stream_html = "<iframe src=\"https://video.nest.com/embedded/live/" + camera.public_share_url.slice(camera.public_share_url.length - 6) + "\" frameborder="0" width="100%" height="100%"></iframe>"
            }
          }
        });
      });
    }

    function unpackStructures (structures, newData) {
      Object.keys(structures).forEach(function (structure) {
        if (structures[structure].name) {
          newData[structures[structure].name] = structures[structure];
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
}());

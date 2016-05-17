(function () {
  freeboard.loadDatasourcePlugin({
    type_name: "nest_camera",
    display_name: "Nest Camera",
    external_scripts: ["https://cdn.firebase.com/js/client/2.4.2/firebase.js"],
    settings: [
      {
        name: "authorization_code",
        display_name: "Authorization Code",
        type: "text",
        description: "Your personal authorization code generated from <a href=\"https://home.nest.com/login/oauth2?client_id=6a45d3f5-b753-4ede-9ebb-f445d87ce088&state=" + getCSRFtoken() + "\" target=\"_blank\">here</a>."
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
      newInstanceCallback(new nestCamera(settings, updateCallback));
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

  var nestCamera = function (settings, updateCallback) {
    var self = this,
        currentSettings = settings;

    function getAccessToken () {
      $.ajax({
        type: "POST",
        url: "https://api.home.nest.com/oauth2/access_token",
        data: {
          code: currentSettings.authorization_code,
          client_id: "6a45d3f5-b753-4ede-9ebb-f445d87ce088",
          client_secret: "ywEKPggAhlKSFg9xxcFI0kock",
          grant_type: "authorization_code"
        },
        success: function (payload) {
          console.log(payload);
          self.access_token = payload.access_token;
        },
        error: function (xhr, status, error) {
        },
        dataType: "JSON"
      });
    }

    var ref;

    function getData () {
      if (typeof self.access_token === "undefined") {
        getAccessToken();
      }

      ref = new Firebase('wss://developer-api.nest.com');
      ref.authWithCustomToken(self.access_token);
      ref.on('value', function (snapshot) {
        console.log(snapshot.val());
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
      ref = undefined;
    };

    createRefreshTimer(currentSettings.refresh_time);
  };
}());

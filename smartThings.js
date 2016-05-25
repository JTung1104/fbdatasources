(function () {
  freeboard.loadDatasourcePlugin({
    type_name: "smartThings",
    display_name: "SmartThings",
    settings: [
      {
        name: "authorization_code",
        display_name: "Authorization Code",
        type: "text",
        description: "Your personal authorization code generated from <a href=\"https://graph.api.smartthings.com/oauth/authorize?response_type=code&client_id=4400c472-33e3-42e0-9d92-2b9e60ebc52d&scope=app&redirect_uri=www.freeboard.io\" target=\"_blank\">here</a>."
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
      newInstanceCallback(new smartThingsDatasource(settings, updateCallback));
    }
  });

  var smartThingsDatasource = function (settings, updateCallback) {
    var self = this,
        refreshTimer,
        currentSettings = settings;

    function getAccessToken () {
    }

    function getData () {
    }

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

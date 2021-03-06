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
      $.ajax({
        type: "POST",
        url: "https://thingproxy.freeboard.io/fetch/https://graph.api.smartthings.com/oauth/token?grant_type=authorization_code&client_id=4400c472-33e3-42e0-9d92-2b9e60ebc52d&client_secret=3a5114d5-b567-48c0-a3d1-af4ae2856671&code=" + currentSettings.authorization_code + "&scope=app&redirect_uri=www.freeboard.io",
        data: {
          grant_type: "authorization_code",
          code: currentSettings.authorization_code,
          client_id: "4400c472-33e3-42e0-9d92-2b9e60ebc52d",
          client_secret: "3a5114d5-b567-48c0-a3d1-af4ae2856671",
          redirect_uri: "www.freeboard.io"
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        success: function (payload) {
          currentSettings.access_token = payload.access_token;
          getEndpoints();
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Basic " + btoa("4400c472-33e3-42e0-9d92-2b9e60ebc52d:3a5114d5-b567-48c0-a3d1-af4ae2856671"));
        }
      });
    }

    function getData () {
      if (typeof currentSettings.access_token === "undefined") {
        getAccessToken();
      } else if (typeof currentSettings.endpoints === "undefined") {
        getEndpoints();
      }

      if (currentSettings.endpoints) {
        getInfo(currentSettings.endpoints.uri);
      }
    }

    function getEndpoints () {
      $.ajax({
        type: "GET",
        url: "https://thingproxy.freeboard.io/fetch/https://graph.api.smartthings.com/api/smartapps/endpoints",
        success: function (payload) {
          currentSettings.endpoints = payload["0"];
          getInfo();
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getInfo(uri) {
      $.ajax({
        method: "GET",
        url: "https://thingproxy.freeboard.io/fetch/" + uri + "/switches",
        success: function (payload) {
          var newData = {};

          payload.forEach(function (object) {
            var newStates = {};

            object.states.forEach(function (state) {
              state.date = new Date().toLocaleString();
              newStates[state.name] = state;
            });

            object.states = newStates;
            newData[object.name] = object;
          });

          updateCallback(newData);
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function createRefreshTimer (interval) {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }

      refreshTimer = setInterval(function () {
        getData();
      }, interval);
    }

    createRefreshTimer(currentSettings.refresh_time * 1000);

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

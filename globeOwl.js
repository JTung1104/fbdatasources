(function () {
  freeboard.loadDatasourcePlugin({
    type_name: "globe_owl",
    display_name: "GlobeOwl",
    settings: [
      {
        name: "unit_name",
        display_name: "Unit Name",
        type: "text"
      },
      {
        name: "refresh",
        display_name: "Refresh Every",
        type: "number",
        suffix: "seconds",
        default_value: 5
      }
    ],
    newInstance: function (settings, newInstanceCallback, updateCallback) {
      newInstanceCallback(new globeOwlDatasource(settings, updateCallback));
    }
  });

  var globeOwlDatasource = function (settings, updateCallback) {
    var self = this,
        refreshTimer,
        currentSettings = settings;

    var getData = function () {
      $.ajax({
        type: "GET",
        url: "https://globe-owl-data.herokuapp.com/data/",
        success: function (payload) {
          updateCallback(payload);
        }
      });
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

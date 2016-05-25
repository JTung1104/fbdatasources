(function () {
  freeboard.loadDatasourcePlugin({
    type_name: "smartThings",
    display_name: "SmartThings",
    settings: [
    ],
    newInstance: function (settings, newInstanceCallback, updateCallback) {
      newInstanceCallback(new smartThingsDatasource(settings, updateCallback));
    }
  });

  var smartThingsDatasource = function (settings, updateCallback) {
    var self = this,
        refreshTimer,
        currentSettings = settings;

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

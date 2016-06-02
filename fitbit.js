(function () {
  freeboard.loadDatasourcePlugin({
    type_name: "fitbit",
    display_name: "Fitbit",
    settings: [
      {
        name: "access_token",
        display_name: "Access Token",
        type: "text",
        description: "Your personal access token generated from <a href=\"https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=227MVH&redirect_uri=https%3A%2F%2Fwww.freeboard.io&scope=activity%20heartrate%20location%20nutrition%20profile%20settings%20sleep%20social%20weight&expires_in=604800\" target=\"_blank\">here</a>. Copy in the text after access_token=."
      },
      {
        name: "refresh_time",
        display_name: "Refresh Every",
        type: "number",
        suffix: "seconds",
        default_value: 60
      },
      {
        name: "daily_activity_date",
        display_name: "Daily Activity Date",
        type: "text",
        description: "The date you want to see your daily activity in the format yyyy-MM-dd.",
        default_value: formatDate(new Date().toLocaleDateString())
      }
    ],
    newInstance: function (settings, newInstanceCallback, updateCallback) {
      newInstanceCallback(new fitbitDatasource(settings, updateCallback));
    }
  });

  function formatDate(dateString) {
    dateString = dateString.split("/");
    if (dateString[0].length < 2) {dateString[0] = "0" + dateString[0];}
    if (dateString[1].length < 2) {dateString[1] = "0" + dateString[1];}
    return dateString[2] + "-" + dateString[0] + "-" + dateString[1];
  }

  var fitbitDatasource = function (settings, updateCallback) {
    var self = this,
        refreshTimer,
        newData = {},
        currentSettings = settings;

    function getData () {
      $.when(
        getProfile(),
        getActivity(),
        getBodyFatLogs(),
        getBodyGoals(),
        getBodyTimeSeriesBMI(),
        getBodyTimeSeriesFat(),
        getBodyTimeSeriesWeight(),
        getLifetimeStats(),
        getDevices(),
        getBadges(),
        getSleepLogs(),
        getSleepGoal()
      ).then(function () {
        updateCallback(newData);
      });
    }

    function getProfile () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/profile.json",
        success: function (payload) {
          newData["Profile"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getActivity () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/activities/date/" + currentSettings.daily_activity_date + ".json",
        success: function (payload) {
          newData["Daily Activity"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getBodyTimeSeriesBMI () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/body/bmi/date/today/max.json",
        success: function (payload) {
          newData["Body Time Series BMI"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getBodyTimeSeriesFat () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/body/fat/date/today/max.json",
        success: function (payload) {
          newData["Body Time Series Fat"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getBodyTimeSeriesWeight () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/body/weight/date/today/max.json",
        success: function (payload) {
          newData["Body Time Series Weight"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getBodyFatLogs () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/body/log/fat/date/" + currentSettings.daily_activity_date + ".json",
        success: function (payload) {
          newData["Body Fat Logs"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getBodyGoals () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/body/log/weight/date/" + currentSettings.daily_activity_date + ".json",
        success: function (payload) {
          newData["Body Goals"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getDevices () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/devices.json",
        success: function (payload) {
          newData["Devices"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getBadges () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/badges.json",
        success: function (payload) {
          newData["Badges"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getSleepLogs () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/sleep/date/" + currentSettings.daily_activity_date + ".json",
        success: function (payload) {
          newData["Sleep Logs"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getSleepGoal () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/sleep/goal.json",
        success: function (payload) {
          newData["Sleep Goal"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getLifetimeStats () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/activities.json",
        success: function (payload) {
          newData["Lifetime Stats"] = payload;
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

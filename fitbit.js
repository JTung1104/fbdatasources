(function () {
  freeboard.loadDatasourcePlugin({
    type_name: "fitbit",
    display_name: "Fitbit",
    settings: [
      {
        name: "access_token",
        display_name: "Access Token",
        type: "text",
        description: "Your personal access token generated from <a href=\"https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=227MVH&redirect_uri=https%3A%2F%2Fwww.freeboard.io&scope=activity%20heartrate%20location%20nutrition%20profile%20settings%20sleep%20social%20weight&expires_in=604800\" target=\"_blank\">here</a>. Copy in the text in the address bar after access_token=."
      },
      {
        name: "refresh_time",
        display_name: "Refresh Every",
        type: "number",
        suffix: "minutes",
        default_value: 10
      },
      {
        name: "daily_activity_date",
        display_name: "Daily Activity Date",
        type: "text",
        description: "The date you wish to see your daily activity in the format yyyy-MM-dd.",
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
      if (currentSettings.daily_activity_date.length == 0) {
        currentSettings.daily_activity_date = formatDate(new Date().toLocaleDateString());
      }

      $.when(
        getProfile,
        getActivity,
        getBodyFatLogs,
        getBodyGoals,
        getBodyTimeSeriesBMI,
        getBodyTimeSeriesFat,
        getBodyTimeSeriesWeight,
        getLifetimeStats,
        getDevices,
        getBadges,
        getSleepLogs,
        getSleepGoal,
        getFoodLogs,
        getFoodGoals,
        getFavoriteFoods,
        getFrequentFoods,
        getFriends,
        getFriendsLeaderboard,
        getWaterLogs,
        getWaterGoal,
        getMeals,
        getAlarms
      ).then(function () {
        updateCallback(newData);
      });
    }

    var getProfile = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/profile.json",
      success: function (payload) {
        newData["Profile"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getActivity = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/activities/date/" + currentSettings.daily_activity_date + ".json",
      success: function (payload) {
        var newDistances = {};

        payload.summary.distances.forEach(function (distance) {
          newDistances[distance.activity] = distance.distance;
        });

        payload.summary.distances = newDistances;
        newData["Daily Activity"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getBodyTimeSeriesBMI = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/body/bmi/date/today/max.json",
      success: function (payload) {

        var newTimeSeries = {};
        payload["body-bmi"].forEach(function(entry) {
          newTimeSeries[entry.dateTime] = entry.value;
        });

        newData["Body Time Series BMI"] = newTimeSeries;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getBodyTimeSeriesFat = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/body/fat/date/today/max.json",
      success: function (payload) {

        var newTimeSeries = {};
        payload["body-fat"].forEach(function(entry) {
          newTimeSeries[entry.dateTime] = entry.value;
        });

        newData["Body Time Series Fat"] = newTimeSeries;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getBodyTimeSeriesWeight = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/body/weight/date/today/max.json",
      success: function (payload) {

        var newTimeSeries = {};
        payload["body-weight"].forEach(function(entry) {
          newTimeSeries[entry.dateTime] = entry.value;
        });

        newData["Body Time Series Weight"] = newTimeSeries;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getBodyFatLogs = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/body/log/fat/date/" + currentSettings.daily_activity_date + ".json",
      success: function (payload) {
        newData["Body Fat Logs"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });


    var getBodyGoals = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/body/log/weight/date/" + currentSettings.daily_activity_date + ".json",
      success: function (payload) {
        newData["Body Goals"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getDevices = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/devices.json",
      success: function (payload) {

        var newDevices = {};
        Object.keys(payload).forEach(function (key) {
          payload[key].lastSyncTime = new Date(payload[key].lastSyncTime).toLocaleString();
          newDevices[payload[key].deviceVersion] = payload[key];

          if (payload[key].type === "TRACKER") {
            currentSettings.tracker_id = payload[key].id;
          }
        });

        newData["Devices"] = newDevices;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getBadges = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/badges.json",
      success: function (payload) {

        var newBadges = {};
        payload.badges.forEach(function (badge) {
          newBadges[badge.description] = badge;
        });

        newData["Badges"] = newBadges;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getSleepLogs = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/sleep/date/" + currentSettings.daily_activity_date + ".json",
      success: function (payload) {

        var newSleepLogs = {};
        payload.sleep.forEach(function (entry) {
          entry.startTime = new Date(entry.startTime).toLocaleString();
          newSleepLogs[entry.dateOfSleep] = entry;
        });

        payload.sleep = newSleepLogs;
        newData["Sleep Logs"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getSleepGoal = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/sleep/goal.json",
      success: function (payload) {
        newData["Sleep Goal"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getLifetimeStats = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/activities.json",
      success: function (payload) {
        newData["Lifetime Stats"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getFoodLogs = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/foods/log/date/" + currentSettings.daily_activity_date + ".json",
      success: function (payload) {

        var newFoods = {};
        payload.foods.forEach(function (food) {
          newFoods[food.loggedFood.name] = food;
        });
        payload.foods = newFoods;

        newData["Food Logs"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getFoodGoals = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/foods/log/goal.json",
      success: function (payload) {
        newData["Food Goals"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getWaterLogs = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/foods/log/water/date/" + currentSettings.daily_activity_date + ".json",
      success: function (payload) {
        newData["Water Logs"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getWaterGoal = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/foods/log/water/goal.json",
      success: function (payload) {
        newData["Water Goal"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getFriends = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/friends.json",
      success: function (payload) {
        newData["Friends"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getFriendsLeaderboard = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/friends/leaderboard.json",
      success: function (payload) {
        newData["Friends Leaderboard"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getHeartRateTimeSeries = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/activities/heart/date/" + currentSettings.daily_activity_date + "/1m.json",
      success: function (payload) {
        newData["Heart Rate Time Series"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getFavoriteFoods = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/foods/log/favorite.json",
      success: function (payload) {
        newData["Favorite Foods"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getFrequentFoods = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/foods/log/frequent.json",
      success: function (payload) {

        var newFrequentFoods = {};
        payload.forEach(function (food) {
          newFrequentFoods[food.name] = food;
        });

        newData["Frequent Foods"] = newFrequentFoods;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getMeals = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/meals.json",
      success: function (payload) {
        newData["Meals"] = payload;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    var getAlarms = $.ajax({
      method: "GET",
      url: "https://api.fitbit.com/1/user/-/devices/tracker/" + currentSettings.tracker_id + "/alarms.json",
      success: function (payload) {

        var newAlarms = {};
        payload.trackerAlarms.forEach(function (alarm) {
          newAlarms[alarm.time] = alarm;
        });

        newData["Alarms"] = newAlarms;
      },
      beforeSend: function (xhr) {
        xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
      }
    });

    function createRefreshTimer (interval) {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }

      refreshTimer = setInterval(function () {
        getData();
      }, interval);
    }

    createRefreshTimer(currentSettings.refresh_time * 1000 * 60);

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

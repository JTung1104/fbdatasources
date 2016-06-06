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
      if (typeof currentSettings.daily_activity_date === "undefined") {
        currentSettings.daily_activity_date = formatDate(new Date().toLocaleDateString());
      }

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
        getSleepGoal(),
        getFoodLogs(),
        getFoodGoals(),
        getFavoriteFoods(),
        getFrequentFoods(),
        getFriends(),
        getFriendsLeaderboard(),
        getWaterLogs(),
        getWaterGoal(),
        getRecentFoods(),
        getMeals()
      ).then(function () {
        updateCallback(newData);
      });
    }

    function getProfile () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/profile.json",
        success: function (payload) {
          console.log("Profile", payload);
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
          console.log("Daily Activity", payload);
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
    }

    function getBodyTimeSeriesBMI () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/body/bmi/date/today/max.json",
        success: function (payload) {
          console.log("Body Time Series BMI", payload);

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
    }

    function getBodyTimeSeriesFat () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/body/fat/date/today/max.json",
        success: function (payload) {
          console.log("Body Time Series Fat", payload);

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
    }

    function getBodyTimeSeriesWeight () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/body/weight/date/today/max.json",
        success: function (payload) {
          console.log("Body Time Series Weight", payload);

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
    }

    function getBodyFatLogs () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/body/log/fat/date/" + currentSettings.daily_activity_date + ".json",
        success: function (payload) {
          console.log("Body Fat Logs", payload);
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
          console.log("Body Goals", payload);
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
          console.log("Devices", payload);

          var newDevices = {};
          Object.keys(payload).forEach(function (key) {
            payload[key].lastSyncTime = new Date(payload[key].lastSyncTime).toLocaleString();
            newDevices[payload[key].deviceVersion] = payload[key];
          });

          newData["Devices"] = newDevices;
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
          console.log("Badges", payload);

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
    }

    function getSleepLogs () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/sleep/date/" + currentSettings.daily_activity_date + ".json",
        success: function (payload) {
          console.log("Sleep Logs", payload);
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
          console.log("Sleep Goal", payload);
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
          console.log("Lifetime Stats", payload);
          newData["Lifetime Stats"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getFoodLogs () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/foods/log/date/" + currentSettings.daily_activity_date + ".json",
        success: function (payload) {
          console.log("Food Logs", payload);
          newData["Food Logs"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getFoodGoals () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/foods/log/goal.json",
        success: function (payload) {
          console.log("Food Goals", payload);
          newData["Food Goals"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getWaterLogs () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/foods/log/water/date/" + currentSettings.daily_activity_date + ".json",
        success: function (payload) {
          console.log("Water Logs", payload);
          newData["Water Logs"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getWaterGoal () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/foods/log/water/goal.json",
        success: function (payload) {
          console.log("Water Goal", payload);
          newData["Water Goal"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getFriends () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/friends.json",
        success: function (payload) {
          console.log("Friends", payload);
          newData["Friends"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getFriendsLeaderboard () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/friends/leaderboard.json",
        success: function (payload) {
          console.log("Friends Leaderboard", payload);
          newData["Friends Leaderboard"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getHeartRateTimeSeries () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/activities/heart/date/" + currentSettings.daily_activity_date + "/1m.json",
        success: function (payload) {
          console.log("Heart Rate Time Series", payload);
          newData["Heart Rate Time Series"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getFavoriteFoods () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/foods/log/favorite.json",
        success: function (payload) {
          console.log("Favorite Foods", payload);
          newData["Favorite Foods"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getFrequentFoods () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/foods/log/frequent.json",
        success: function (payload) {
          console.log("Frequent Foods", payload);
          newData["Frequent Foods"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getRecentFoods () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/foods/recent.json",
        success: function (payload) {
          console.log("Recent Foods", payload);
          newData["Recent Foods"] = payload;
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        }
      });
    }

    function getMeals () {
      $.ajax({
        method: "GET",
        url: "https://api.fitbit.com/1/user/-/meals.json",
        success: function (payload) {
          console.log("Meals", payload);
          newData["Meals"] = payload;
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

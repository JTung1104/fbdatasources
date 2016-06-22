(function () {
  freeboard.loadDatasourcePlugin({
    type_name: "asana",
    display_name: "Asana",
    settings: [
      {
        name: "authorization_code",
        display_name: "Authorization Code",
        type: "text",
        description: "Your personal authorization code generated from <a href=\"https://app.asana.com/-/oauth_authorize?response_type=code&client_id=145167453298639&redirect_uri=https%3A%2F%2Fwww.freeboard.io&state=state\" target=\"_blank\">here</a>. Copy in the text in the address bar after access_token=."
      },
      {
        name: "refresh_time",
        display_name: "Refresh Every",
        type: "number",
        suffix: "seconds",
        default_value: 60
      }
    ],
    newInstance: function (settings, newInstanceCallback, updateCallback) {
      newInstanceCallback(new asanaDatasource(settings, updateCallback));
    }
  });

  var asanaDatasource = function (settings, updateCallback) {
    var self = this,
        refreshTimer,
        newData = {},
        currentSettings = settings;

    function getData () {
      if (typeof currentSettings.access_token === "undefined") {
        getAccessToken();
      } else if (Date.now() >= currentSettings.expiration_time) {
        refreshAccessToken();
      } else {
        getProjects();
        getWorkspaces();
      }
    }

    var getAccessToken = function () {
      $.ajax({
        type: "POST",
        url: "https://thingproxy.freeboard.io/fetch/https://app.asana.com/-/oauth_token?grant_type=authorization_code&code=" + currentSettings.authorization_code + "&client_id=145167453298639&client_secret=3bdb7d70e3e553d2233f61feebd0cf88&redirect_uri=https://www.freeboard.io",
        success: function (payload) {
          console.log("access", payload);
          currentSettings.expiration_time = Date.now() + (payload.expires_in * 1000);
          currentSettings.access_token = payload.access_token;
          currentSettings.refresh_token = payload.refresh_token;
        },
        dataType: "JSON"
      });
    }

    var refreshAccessToken = function () {
      $.ajax({
        type: "POST",
        url: "https://thingproxy.freeboard.io/fetch/https://app.asana.com/-/oauth_token?grant_type=refresh_token&refresh_token=" + currentSettings.refresh_token + "&client_id=145167453298639&client_secret=3bdb7d70e3e553d2233f61feebd0cf88&redirect_uri=https://www.freeboard.io",
        success: function (payload) {
          console.log("refresh", payload);
          currentSettings.expiration_time = Date.now() + (payload.expires_in * 1000);
          currentSettings.access_token = payload.access_token;
        },
        dataType: "JSON"
      });
    }

    var getWorkspaces = function () {
      $.ajax({
        type: "GET",
        url: "https://app.asana.com/api/1.0/workspaces",
        headers: {
          "Content-Type": "application/json"
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        },
        success: function (payload) {
          console.log("workspaces", payload);
          payload.data.forEach(function (workspace) {
            getSingleWorkspace(workspace.id);
          });
        },
        dataType: "JSON"
      });
    }

    var getSingleWorkspace = function (id) {
      $.ajax({
        type: "GET",
        url: "https://app.asana.com/api/1.0/workspaces/" + id,
        headers: {
          "Content-Type": "application/json"
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        },
        success: function (payload) {
          console.log("single workspace", payload);
          newData.Workspaces[payload.name] = payload;
        },
        dataType: "JSON"
      });
    };

    var getProjects = function () {
      $.ajax({
        type: "GET",
        url: "https://app.asana.com/api/1.0/projects",
        headers: {
          "Content-Type": "application/json"
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        },
        success: function (payload) {
          console.log("projects", payload);
          getProjectTasks(payload.data);
          newData.Projects = payload;
        },
        dataType: "JSON"
      });
    };

    var getProjectTasks = function (projects) {
      projects.forEach(function (project) {
        $.ajax({
          type: "GET",
          url: "https://app.asana.com/api/1.0/projects/" + project.id + "/tasks",
          headers: {
            "Content-Type": "application/json"
          },
          beforeSend: function (xhr) {
            xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
          },
          success: function (payload) {
            console.log("tasks", payload);
            newData.ProjectTasks = payload;
          },
          dataType: "JSON"
        });
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

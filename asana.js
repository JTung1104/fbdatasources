(function () {
  freeboard.loadDatasourcePlugin({
    type_name: "asana",
    display_name: "Asana",
    settings: [
      {
        name: "authorization_code",
        display_name: "Authorization Code",
        type: "text",
        description: "Your personal authorization code generated from <a href=\"https://app.asana.com/-/oauth_authorize?response_type=code&client_id=145167453298639&redirect_uri=https%3A%2F%2Fwww.freeboard.io&state=state\" target=\"_blank\">here</a>. Copy in the text in the address bar after code= up until the '&'."
      },
      {
        name: "access_token",
        display_name: "Access Token",
        type: "text",
        description: "Leave this field blank."
      },
      {
        name: "refresh_token",
        display_name: "Refresh Token",
        type: "text",
        description: "Leave this field blank."
      },
      {
        name: "expiration_time",
        display_name: "Token Expiration Time",
        type: "number",
        description: "Leave this field blank.",
        default_value: 0
      },
      {
        name: "refresh_time",
        display_name: "Refresh Every",
        type: "number",
        suffix: "seconds",
        default_value: 600
      }
    ],
    newInstance: function (settings, newInstanceCallback, updateCallback) {
      newInstanceCallback(new asanaDatasource(settings, updateCallback));
    }
  });

  var asanaDatasource = function (settings, updateCallback) {
    var self = this,
        refreshTimer,
        newData = {
          Workspaces: {},
          Projects: {},
          Attachments: {}
        },
        currentSettings = settings;

    function getData () {
      if (typeof currentSettings.access_token === "undefined") {
        getAccessToken();
      } else if (Date.now() >= currentSettings.expiration_time) {
        refreshAccessToken();
      }

      if (currentSettings.access_token) {
        getProjects();
        getWorkspaces();
      }
    }

    var getAccessToken = function () {
      $.ajax({
        type: "POST",
        url: "https://thingproxy.freeboard.io/fetch/https://app.asana.com/-/oauth_token?grant_type=authorization_code&code=" + currentSettings.authorization_code + "&client_id=145167453298639&client_secret=3bdb7d70e3e553d2233f61feebd0cf88&redirect_uri=https://www.freeboard.io",
        success: function (payload) {
          currentSettings.expiration_time = Date.now() + (payload.expires_in * 1000);
          currentSettings.access_token = payload.access_token;
          currentSettings.refresh_token = payload.refresh_token;
          getData();
        },
        dataType: "JSON"
      });
    }

    var refreshAccessToken = function () {
      $.ajax({
        type: "POST",
        url: "https://thingproxy.freeboard.io/fetch/https://app.asana.com/-/oauth_token?grant_type=refresh_token&refresh_token=" + currentSettings.refresh_token + "&client_id=145167453298639&client_secret=3bdb7d70e3e553d2233f61feebd0cf88&redirect_uri=https://www.freeboard.io",
        success: function (payload) {
          currentSettings.expiration_time = Date.now() + (payload.expires_in * 1000);
          currentSettings.access_token = payload.access_token;
          getData();
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
          formatWorkspaceEmailDomains(payload.data);
          newData.Workspaces[payload.data.name] = payload.data;
        },
        dataType: "JSON"
      });
    };

    var formatWorkspaceEmailDomains = function (workspace) {
      var newEmail = {};

      workspace.email_domains.forEach(function (email) {
        newEmail[email] = email;
      });

      workspace.email_domains = newEmail;
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
          payload.data.forEach(function (project) {
            getSingleProject(project.id);
          });
        },
        dataType: "JSON"
      });
    };

    var getSingleProject = function (id) {
      $.ajax({
        type: "GET",
        url: "https://app.asana.com/api/1.0/projects/" + id,
        headers: {
          "Content-Type": "application/json"
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        },
        success: function (payload) {
          newData.Projects[payload.data.name] = formatProjectData(payload);
          getProjectTasks(payload.data);
        },
        dataType: "JSON"
      });
    };

    var formatProjectData = function (project) {
      formatProjectMembers(project);
      formatProjectFollowers(project);
      formatProjectTime(project);
      return project.data;
    };

    var formatProjectMembers = function (project) {
      var members = {};

      project.data.members.forEach(function (member) {
        members[member.name] = member;
      });

      project.data.members = members;
    };

    var formatProjectFollowers = function (project) {
      var followers = {};

      project.data.followers.forEach(function (follower) {
        followers[follower.name] = follower;
      });

      project.data.followers = followers;
    };

    var formatProjectTime = function (project) {
      project.data.created_at = new Date(project.data.created_at).toLocaleString();
      project.data.due_date = new Date(project.data.due_date).toLocaleString();
      project.data.modified_at = new Date(project.data.modified_at).toLocaleString();
    };

    var getProjectTasks = function (project) {
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
          newData.Projects[project.name].Tasks = formatProjectTasks(payload.data);

          payload.data.forEach(function (task) {
            getAllAttachments(task);
          });
        },
        dataType: "JSON"
      });
    };

    var getAllAttachments = function (task) {
      $.ajax({
        type: "GET",
        url: "https://app.asana.com/api/1.0/tasks/" + task.id + "/attachments",
        headers: {
          "Content-Type": "application/json"
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        },
        success: function (payload) {
          if (payload.data.length > 0) {
            newData.Attachments[task.name] = payload.data;
          }
          updateCallback(newData);
        },
        dataType: "JSON"
      });
    };

    var formatProjectTasks = function (tasks) {
      var newTasks = {};

      tasks.forEach(function (task) {
        newTasks[task.name] = task;
      });

      return newTasks;
    };

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

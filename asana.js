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
        name: "sync_token",
        display_name: "Sync Token",
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
        suffix: "hours",
        default_value: 6
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
          Projects: {}
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
        url: "https://cors-anywhere.herokuapp.com/https://app.asana.com/-/oauth_token?grant_type=authorization_code&code=" + currentSettings.authorization_code + "&client_id=145167453298639&client_secret=3bdb7d70e3e553d2233f61feebd0cf88&redirect_uri=https://www.freeboard.io",
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
        url: "https://cors-anywhere.herokuapp.com/https://app.asana.com/-/oauth_token?grant_type=refresh_token&refresh_token=" + currentSettings.refresh_token + "&client_id=145167453298639&client_secret=3bdb7d70e3e553d2233f61feebd0cf88&redirect_uri=https://www.freeboard.io",
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
          payload.data.email_domains = formatWorkspaceEmailDomains(payload.data);
          newData.Workspaces[payload.data.name] = payload.data;
          getWorkspaceUsers(id, payload.data.name);
          getWorkspaceTeams(id, payload.data.name);
        },
        dataType: "JSON"
      });
    };

    var getWorkspaceUsers = function (id, workspaceName) {
      $.ajax({
        type: "GET",
        url: "https://app.asana.com/api/1.0/workspaces/" + id + "/users",
        headers: {
          "Content-Type": "application/json"
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        },
        success: function (payload) {
          newData.Workspaces[workspaceName].Users = formatWorkspaceUsers(payload.data);
          console.log("Workspace Users", formatWorkspaceUsers(payload.data));
        },
        dataType: "JSON"
      });
    };

    var formatWorkspaceUsers = function (workspaceUsers) {
      var newUsers = {};

      workspaceUsers.forEach(function(user) {
        newUsers[user.name] = user;
      });

      return newUsers;
    };

    var getWorkspaceTeams = function (id, workspaceName) {
      $.ajax({
        type: "GET",
        url: "https://app.asana.com/api/1.0/organizations/" + id + "/teams",
        headers: {
          "Content-Type": "application/json"
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        },
        success: function (payload) {
          newData.Workspaces[workspaceName].Teams = formatWorkspaceTeams(payload.data);
        },
        dataType: "JSON"
      });
    };

    var formatWorkspaceTeams = function (workspaceTeams) {
      var newTeams = {};

      workspaceTeams.forEach(function(team) {
        if (team.name.length > 0) {
          newTeams[team.name] = team;
        }
      });

      return newTeams;
    }

    var formatWorkspaceEmailDomains = function (workspace) {
      var newEmail = {};

      workspace.email_domains.forEach(function (email) {
        newEmail[email] = email;
      });

      return newEmail;
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
          getProjectEvents(payload.data);
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
            getSubtasks(task, project);
            getTaskEvents(task, project);
            getAllAttachments(task, project);
          });
        },
        dataType: "JSON"
      });
    };

    var getProjectEvents = function (project, syncToken) {
      $.ajax({
        type: "GET",
        url: "https://app.asana.com/api/1.0/projects/" + project.id + "/events?sync=" + syncToken,
        headers: {
          "Content-Type": "application/json"
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        },
        success: function (payload) {
          console.log("Project Events", payload);
          if (payload.data.length > 0) {
            newData.Projects[project.name].Events = payload.data;
            updateCallback(newData);
          }
        },
        error: function (e) {
          console.log("Project Events", e);
          getProjectEvents(project, e.responseJSON.sync);
        },
        dataType: "JSON"
      });
    };

    var getTaskEvents = function (task, project, syncToken) {
      $.ajax({
        type: "GET",
        url: "https://app.asana.com/api/1.0/tasks/" + task.id + "/events?sync=" + syncToken,
        headers: {
          "Content-Type": "application/json"
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        },
        success: function (payload) {
          if (payload.data.length > 0) {
            newData.Projects[project.name].Tasks[task.name].Events = payload.data;
            updateCallback(newData);
          }
        },
        error: function (e) {
          console.log("Task Events", e);
          getTaskEvents(task, e.responseJSON.sync);
        },
        dataType: "JSON"
      });
    };

    var getAllAttachments = function (task, project) {
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
            newData.Projects[project.name].Tasks[task.name].Attachments = payload.data;
            updateCallback(newData);
          }
        },
        dataType: "JSON"
      });
    };

    var getSubtasks = function (task, project) {
      $.ajax({
        type: "GET",
        url: "https://app.asana.com/api/1.0/tasks/" + task.id + "/subtasks",
        headers: {
          "Content-Type": "application/json"
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        },
        success: function (payload) {
          if (payload.data.length > 0) {
            newData.Projects[project.name].Tasks[task.name].Subtasks = formatProjectTasks(payload.data);
          }

          console.log(newData);
          updateCallback(newData);
        },
        dataType: "JSON"
      });
    }

    var formatProjectTasks = function (tasks) {
      var newTasks = {};

      tasks.forEach(function (task) {
        createTaskCompleteButton(task);
        newTasks[task.name] = task;
      });

      return newTasks;
    };

    var createTaskCompleteButton = function (task) {
      task.html = "<div style=\"height:100%;width:100%;display:flex;justify-content:space-around;align-items:center;\"><p style=\"display:inline-block;\">" + task.name + "</p><button id=\"task_" + task.id + "\">Complete</button></div>";

      $('body').on('click', '#task_' + task.id, function () {
        completeTask(task);
        $('#task_' + task.id).html("Task Completed!");
      });
    };

    var completeTask = function (task) {
      $.ajax({
        type: "PUT",
        url: "https://app.asana.com/api/1.0/tasks/" + task.id,
        headers: {
          "Content-Type": "application/json"
        },
        beforeSend: function (xhr) {
          xhr.setRequestHeader ("Authorization", "Bearer " + currentSettings.access_token);
        },
        data: JSON.stringify({
          data: {
            completed: true
          }
        }),
        success: function (payload) {
        },
        error: function (e) {
          console.log("Task Completion Error!", e);
        },
        dataType: "JSON"
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

    createRefreshTimer(currentSettings.refresh_time * 1000 * 60 * 60);

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

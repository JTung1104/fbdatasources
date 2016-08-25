(function () {
  freeboard.loadDatasourcePlugin({
    type_name: "o2",
    display_name: "O2 Concepts",
    settings: [
      {
        name: "serial_number",
        display_name: "Serial Number",
        type: "text"
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
      newInstanceCallback(new o2Datasource(settings, updateCallback));
    }
  });

  var o2Datasource = function (settings, updateCallback) {
    var self = this,
        refreshTimer,
        currentSettings = settings;

    var getData = function () {
      $.ajax({
        type: "GET",
        url: "https://corsanywhere.herokuapp.com/http://www.o2pocdata.com/rdm-data/" + currentSettings.serial_number + "/refresh",
        success: function (payload) {
          console.log(formatData(payload));
          updateCallback(formatData(payload));
        },
        error: function (e) {
          console.log("Error", e);
        },
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
    };

    var formatData = function (string) {
      var words = [];

      string.split(" ").forEach(function (word) {
        if (word !== "") {words.push(word)}
      });

      if (words.length !== 27) {return ({})} // If no data

      var newData = {
        "Software Versions": {},
        "Inlet Side Battery": {},
        "Exhaust Side Battery": {}
      };

      newData["Serial Number"] = words[0].slice(3);
      newData["Last Updated"] = words[1] + " " + words[2].slice(0, -4);
      newData["Software Versions"]["Display PCB"] = words[3].slice(0, -1);
      newData["Software Versions"]["Main PCB"] = words[4].slice(0, -1);

      var versions = words[5].split("/");

      newData["Software Versions"]["Motor"] = versions[0];
      newData["Software Versions"]["Purity Sensor"] = versions[1];
      newData["Software Versions"]["Main PCB Revision"] = versions[2];
      newData["Software Versions"]["Display PCB Revision"] = versions[3].slice(0, versions[3].indexOf("D"));

      newData["DNA Data Records"] = versions[3].slice(versions[3].indexOf(":") + 1);
      newData["DNA Failed Send Attempts"] = versions[4].slice(0, versions[4].indexOf(":"));
      newData["DNA Last Attempt Status Code"] = versions[4].slice(versions[4].indexOf(":") + 1);

      var diagnostics = words[6].split("/");

      newData["Remote Diagnostics Records"] = diagnostics[0].slice(diagnostics[0].indexOf(":") + 1);
      newData["Remote Diagnostics Failed Send Attempts"] = diagnostics[1].slice(0, diagnostics[1].indexOf(":"));
      newData["Remote Diagnostics Last Attempt Status Code"] = diagnostics[1].slice(diagnostics[1].indexOf(":") + 1);

      newData["Cell Signal Strength"] = words[7].slice(3, -1);

      newData["Inlet Side Battery"]["Temperature (Celsius)"] = words[8].slice(3);
      newData["Exhaust Side Battery"]["Temperature (Celsius)"] = words[9].slice(3);
      newData["Pump Temperature (Celsius)"] = words[10].slice(2);
      newData["Display PCB Temperature (Celsius)"] = words[11].slice(2);
      newData["Main PCB Temperature (Celsius)"] = words[12].slice(2);
      newData["Oxygen Temperature (Celsius)"] = words[13].slice(3, words[13].indexOf("B"));

      newData["Inlet Side Battery"]["Current (milliamps)"] = words[13].slice(words[13].indexOf("B") + 3);
      newData["Inlet Side Battery"]["Charge (%)"] = words[14];
      newData["Inlet Side Battery"]["Minutes Until Out Of Battery"] = words[15];
      newData["Inlet Side Battery"]["Lifetime Battery Discharge Cycles"] = words[16].slice(0, words[16].indexOf("B"));

      newData["Exhaust Side Battery"]["Current (milliamps)"] = words[16].slice(words[16].indexOf(":" + 1));
      newData["Exhaust Side Battery"]["Charge (%)"] = words[17];
      newData["Exhaust Side Battery"]["Minutes Until Out Of Battery"] = words[18];
      newData["Exhaust Side Battery"]["Lifetime Battery Discharge Cycles"] = words[19].slice(0, words[19].indexOf("V"));

      newData["Voltage In (volts)"] = words[19].slice(words[19].indexOf(":") + 1);
      newData["Voltage After Conversion (volts)"] = words[20];
      newData["Last Alarm"] = words[21].slice(0, words[21].indexOf("PS"));
      newData["Power Supply"] = (words[21].slice(-1) === "1"
                              ? "220 Watt Large Power Supply"
                              : "150 Watt Standard Power Supply");

      newData["Cellular Connection"] = words[22].slice(words[22].indexOf(":") + 1) + " " + words[23].slice(0, words[23].indexOf("Flow"));
      newData["Flow (liters per minute)"] = words[24];
      newData["% Oxygen"] = words[25].slice(words[25].indexOf(":") + 1);
      newData["Atmospheric Pressure (pounds per square inch)"] = words[26].slice(words[26].indexOf(":") + 1);

      return newData;
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

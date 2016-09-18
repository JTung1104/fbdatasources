(function () {
  freeboard.loadDatasourcePlugin({
    type_name: "o2",
    display_name: "O2 Concepts",
    external_scripts: [
      "https://cdn.rawgit.com/lightswitch05/table-to-json/master/lib/jquery.tabletojson.min.js"
    ],
    settings: [
      {
        name: "serial_number",
        display_name: "Serial Number",
        type: "text"
      },
      {
        name: "start_time",
        display_name: "Start Time",
        type: "number",
        description: "Leave this field blank.",
        default_value: 0
      },
      {
        name: "end_time",
        display_name: "End Time",
        type: "number",
        description: "Leave this field blank.",
        default_value: 0
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

    var newData = {
      "Historical": {},
      "RDM": {
        "Software Versions": {},
        "Inlet Side Battery": {},
        "Exhaust Side Battery": {}
      }
    };

    var createInputField = function () {
      newData.Input = `
        <div style="height:100%;width:100%;display:flex;flex-direction:column;justify-content:space-around;align-items:center;">
          <label style="display:flex;flex-direction:column;">Serial Number
            <input id="serial_number_input" style="display:inline-block;"/>
          </label>
          <div style="display:flex;flex-direction:column;justify-content:space-around;align-items:center;"><div>Start Date</div>
          `
      newData.Input += getSelectMonths("start_month");
      newData.Input += getSelectYears("start_year");
      newData.Input += "</div>";
      newData.Input += "<div style=\"display:flex;flex-direction:column;justify-content:space-around;align-items:center;\"><div>End Date</div>";
      newData.Input += getSelectMonths("end_month");
      newData.Input += getSelectYears("end_year");
      newData.Input += "</div><button id=\"submit\">SET</button></div>"

      $('body').on('click', '#submit', function () {
        var serialNumber = document.getElementById("serial_number_input").value;
        var startMonth = document.getElementById("start_month").value;
        var startYear = document.getElementById("start_year").value;
        var endMonth = document.getElementById("end_month").value;
        var endYear = document.getElementById("end_year").value;

        if (serialNumber) {currentSettings.serial_number = serialNumber;}
        if (startMonth && startYear) {currentSettings.start_time = new Date(startYear, startMonth).getTime()}
        if (endMonth && endYear) {currentSettings.end_time = new Date(endYear, endMonth).getTime()}
        getData(currentSettings.start_time, currentSettings.end_time);
      });
    };

    var getSelectYears = function (name) {
      var selectYears = `<select id=${name}>
                          <option value="undefined">Select a year...</option>`;
      var nextYear = new Date().getYear() + 2;

      for (var i = 70; i < nextYear; i++) {
        selectYears += "<option value=\"" + (1900 + i) + "\">" + (1900 + i) + "</option>";
      }

      selectYears += "</select>";

      return selectYears;
    };

    var getSelectMonths = function (name) {
      return (
        `<select id="${name}">
          <option value="undefined">Select a month...</option>
          <option value="0">January</option>
          <option value="1">February</option>
          <option value="2">March</option>
          <option value="3">April</option>
          <option value="4">May</option>
          <option value="5">June</option>
          <option value="6">July</option>
          <option value="7">August</option>
          <option value="8">September</option>
          <option value="9">October</option>
          <option value="10">November</option>
          <option value="11">December</option>
        </select>`);
    };

    var getData = function (startTime, endTime) {
      newData = {
        "Historical": {},
        "RDM": {
          "Software Versions": {},
          "Inlet Side Battery": {},
          "Exhaust Side Battery": {}
        }
      };

      if (typeof newData.Input === "undefined") {createInputField();}

      $.ajax({
        type: "GET",
        url: "https://corsanywhere.herokuapp.com/http://www.o2pocdata.com/rdm-data/" + currentSettings.serial_number + "/refresh",
        success: function (payload) {
          getReports(startTime, endTime);
          formatRDMData(payload);
          updateCallback(newData);
        },
        error: function (e) {
          console.log("Error", e);
        },
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
    };

    var getReports = function (startTime, endTime) {
      var url = "https://cors-anywhere.herokuapp.com/http://www.o2pocdata.com/reports/?fields=SN&SN=" + currentSettings.serial_number + "&fields=MEID&MEID=&fields=date&fields=TimStrt&fields=MinsLong&fields=SWV&fields=HWV&fields=CellSS&fields=MtrRPM&fields=MtrAmps&fields=MtrTmp&fields=ContSet&fields=PulsSet&fields=MeasFlow&fields=UnitTmp&fields=O2Tmp&fields=TankPrs&fields=HosePrs&fields=BaroPrs&fields=Pur&fields=VIn&fields=CarVIn&fields=BattPer&fields=BattMa&fields=RunTime&fields=O2PurSmpl&fields=Pwrs&fields=CellRst&fields=Err&fields=ACBPM&fields=CarBPM&fields=BatBPM&fields=Batt&fields=Alrm&fields=Loc&fields=CellLoc&fields=Mode&fields=Cks&limit=0"

      $.ajax({
        type: "GET",
        url: url,
        success: function (payload) {
          var table = $.parseHTML(payload)[7];
          table.setAttribute("class", "o2-reports");
          $("#board-content").append(table);
          var reports = $(".o2-reports").tableToJSON({
            allowHTML: true
          });
          $(".o2-reports").remove();

          formatReports(reports, startTime, endTime);
          updateCallback(newData);
        },
        error: function (e) {
          console.log("Error", e);
        },
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
    };

    var getDate = function (string) {
      var date = new Date(string).toLocaleString();

      if (date === "Invalid Date") {
        date = string.split(" ");
        var calendarPart = date[0].split("-");
        var timePart = date[1].split(":");
        var year = calendarPart[0];
        var month = calendarPart[1] - 1;
        var day = calendarPart[2];
        var hours = timePart[0];
        var minutes = timePart[1];
        var seconds = timePart[2].split(".")[0];

        return new Date(year, month, day, hours, minutes, seconds).toLocaleString();
      }

      return date;
    };

    var formatRDMData = function (string) {
      var words = [];

      string.split(" ").forEach(function (word) {
        if (word !== "") {words.push(word)}
      });

      if (words.length !== 27) {return ({})} // If no data

      newData["RDM"]["Serial Number"] = words[0].slice(3);
      newData["RDM"]["Last Updated"] = words[1] + " " + words[2].slice(0, -4);
      newData["RDM"]["Software Versions"]["Display PCB"] = words[3].slice(0, -1);
      newData["RDM"]["Software Versions"]["Main PCB"] = words[4].slice(0, -1);

      var versions = words[5].split("/");

      newData["RDM"]["Software Versions"]["Motor"] = versions[0];
      newData["RDM"]["Software Versions"]["Purity Sensor"] = versions[1];
      newData["RDM"]["Software Versions"]["Main PCB Revision"] = versions[2];
      newData["RDM"]["Software Versions"]["Display PCB Revision"] = versions[3].slice(0, versions[3].indexOf("D"));

      newData["RDM"]["DNA Data Records"] = versions[3].slice(versions[3].indexOf(":") + 1);
      newData["RDM"]["DNA Failed Send Attempts"] = versions[4].slice(0, versions[4].indexOf(":"));
      newData["RDM"]["DNA Last Attempt Status Code"] = versions[4].slice(versions[4].indexOf(":") + 1);

      var diagnostics = words[6].split("/");

      newData["RDM"]["Remote Diagnostics Records"] = diagnostics[0].slice(diagnostics[0].indexOf(":") + 1);
      newData["RDM"]["Remote Diagnostics Failed Send Attempts"] = diagnostics[1].slice(0, diagnostics[1].indexOf(":"));
      newData["RDM"]["Remote Diagnostics Last Attempt Status Code"] = diagnostics[1].slice(diagnostics[1].indexOf(":") + 1);

      newData["RDM"]["Cell Signal Strength"] = words[7].slice(3, -1);

      newData["RDM"]["Inlet Side Battery"]["Temperature (Celsius)"] = words[8].slice(3);
      newData["RDM"]["Exhaust Side Battery"]["Temperature (Celsius)"] = words[9].slice(3);
      newData["RDM"]["Pump Temperature (Celsius)"] = words[10].slice(2);
      newData["RDM"]["Display PCB Temperature (Celsius)"] = words[11].slice(2);
      newData["RDM"]["Main PCB Temperature (Celsius)"] = words[12].slice(2);
      newData["RDM"]["Oxygen Temperature (Celsius)"] = words[13].slice(3, words[13].indexOf("B"));

      newData["RDM"]["Inlet Side Battery"]["Current (milliamps)"] = words[13].slice(words[13].indexOf("B") + 3);
      newData["RDM"]["Inlet Side Battery"]["Charge (%)"] = words[14];
      newData["RDM"]["Inlet Side Battery"]["Minutes Until Out Of Battery"] = words[15];
      newData["RDM"]["Inlet Side Battery"]["Lifetime Battery Discharge Cycles"] = words[16].slice(0, words[16].indexOf("B"));

      newData["RDM"]["Exhaust Side Battery"]["Current (milliamps)"] = words[16].slice(words[16].indexOf(":" + 1));
      newData["RDM"]["Exhaust Side Battery"]["Charge (%)"] = words[17];
      newData["RDM"]["Exhaust Side Battery"]["Minutes Until Out Of Battery"] = words[18];
      newData["RDM"]["Exhaust Side Battery"]["Lifetime Battery Discharge Cycles"] = words[19].slice(0, words[19].indexOf("V"));

      newData["RDM"]["Voltage In (volts)"] = words[19].slice(words[19].indexOf(":") + 1);
      newData["RDM"]["Voltage After Conversion (volts)"] = words[20];
      newData["RDM"]["Last Alarm"] = words[21].slice(0, words[21].indexOf("PS"));
      newData["RDM"]["Power Supply"] = (words[21].slice(-1) === "1"
                              ? "220 Watt Large Power Supply"
                              : "150 Watt Standard Power Supply");

      newData["RDM"]["Cellular Connection"] = words[22].slice(words[22].indexOf(":") + 1) + " " + words[23].slice(0, words[23].indexOf("Flow"));
      newData["RDM"]["Flow (liters per minute)"] = words[24];
      newData["RDM"]["% Oxygen"] = words[25].slice(words[25].indexOf(":") + 1);
      newData["RDM"]["Atmospheric Pressure (pounds per square inch)"] = words[26].slice(words[26].indexOf(":") + 1);
    };

    var formatReports = function (array, startTime, endTime) {
      array.forEach(function (report) {
        replaceLineBreaksInReport(report);
        formatReportAlarms(report);
        formatReportCellLoc(report);
        formatReportLoc(report);
        formatReportMode(report);
        formatReportRunTime(report);
        formatReportBatt(report);
        report.date = getDate(report.date);
        report.TimStrt = getDate(report.TimStrt);

        debugger
        if (startTime && endTime) {
          if (startTime && new Date(report.date).getTime() >= startTime) {
            if (endTime && new Date(report.date).getTime() <= endTime) {
              newData["Historical"][report.date] = report;
            }
          }
        } else if (startTime) {
          if (new Date(report.date).getTime() >= startTime) {newData["Historical"][report.date] = report;}
        } else if (endTime) {
          if (new Date(report.date).getTime() <= endTime) {newData["Historical"][report.date] = report;}
        } else {
          newData["Historical"][report.date] = report;
        }
      });
    };

    var formatReportAlarms = function (report) {
      if (report.Alrm) {
        var data = report.Alrm.split("<td>");
        report.Alrm = {};
        for (var i = 1; i < data.length; i += 2) {
          var date = getDate(data[i].slice(0, data[i].indexOf("</td>")));
          report.Alrm[date] = {};
          report.Alrm[date].Time = date;
          report.Alrm[date].Fault = data[i + 1].slice(0, data[i + 1].indexOf("</td>"));
        }
      }
    };

    var formatReportCellLoc = function (report) {
      if (report.CellLoc) {
        var data = report.CellLoc.split("<td>");
        report.CellLoc = {};
        report.CellLoc.Time = getDate(data[1].slice(0, data[1].indexOf("</td>")));
        report.CellLoc.Latitude = data[2].slice(0, data[2].indexOf("</td>"));
        report.CellLoc.Longitude = data[3].slice(0, data[3].indexOf("</td>"));
        report.CellLoc.Altitude = data[4].slice(0, data[4].indexOf("</td>"));
        report.CellLoc.Accuracy = data[5].slice(0, data[5].indexOf("</td>"));
      }
    };

    var formatReportLoc = function (report) {
      if (report.Loc) {
        var data = report.Loc.split("<td>");
        report.Loc = {};

        for (var i = 1; i < data.length; i += 4) {
          report.Loc.Time = getDate(data[i].slice(0, data[i].indexOf("</td>")));
          report.Loc.Latitude = data[i + 1].slice(0, data[i + 1].indexOf("</td>"));
          report.Loc.Longitude = data[i + 2].slice(0, data[i + 2].indexOf("</td>"));
          report.Loc.Altitude = data[i + 3].slice(0, data[i + 3].indexOf("</td>"));
        }
      }
    };

    var formatReportMode = function (report) {
      if (report.Mode) {
        var data = report.Mode.split("<td>");
        report.Mode = {};

        for (var i = 1; i < data.length; i += 4) {
          var date = getDate(data[i].slice(0, data[i].indexOf("</td>")));
          report.Mode[date] = {};
          report.Mode[date].Time = date;
          report.Mode[date].Power = data[i + 1].slice(0, data[i + 1].indexOf("</td>"));
          report.Mode[date].Flow = data[i + 2].slice(0, data[i + 2].indexOf("</td>"));
          report.Mode[date].Set = data[i + 3].slice(0, data[i + 3].indexOf("</td>"));
        }
      }
    };

    var formatReportRunTime = function (report) {
      if (report.RunTime) {
        var data = report.RunTime.split("<td>");
        report.RunTime = {};
        report.RunTime.Life = data[1].slice(0, data[1].indexOf("</td>"));
        report.RunTime.Car = data[2].slice(0, data[2].indexOf("</td>"));
        report.RunTime.Battery = data[3].slice(0, data[3].indexOf("</td>"));
        report.RunTime["24V"] = data[4].slice(0, data[4].indexOf("</td>"));
        report.RunTime.Charge = data[5].slice(0, data[5].indexOf("</td>"));
      }
    };

    var formatReportBatt = function (report) {
      if (report.Batt) {
        var data = report.Batt.split("<td>");
        report.Batt = {};

        for (var i = 1; i < data.length; i += 3) {
          var SN = data[i].slice(0, data[i].indexOf("</td>"));
          report.Batt[SN] = {};
          report.Batt[SN].SN = SN;
          report.Batt[SN].Cap = data[i + 1].slice(0, data[i + 1].indexOf("</td>"));
          report.Batt[SN].RunMins = data[i + 2].slice(0, data[i + 2].indexOf("</td>"));
        }
      }
    };

    var replaceLineBreaksInReport = function (object) {
      Object.keys(object).forEach(function (key) {
        object[key] = replaceLineBreaks(object[key]);
      });
    };

    var replaceLineBreaks = function (string) {
      return string.replace(/(\r\n|\n|\r)/gm, " ");
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

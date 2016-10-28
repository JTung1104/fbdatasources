(function () {
    freeboard.loadDatasourcePlugin({
        "display_name": "Dweet Storage",
        "type_name": "dweetStorageDatasource",
        "settings": [
            {
                "name": "thing_name",
                "display_name": "Thing Name",
                "description": "MUST be a locked thing.  See <a href='https://dweet.io/locks'>https://dweet.io/locks</a> for more info",
                "type": "text",
                "required": true
            },
            {
                "name": "start_date",
                "display_name": "Start Date",
                "type": "text",
                "description": "The calendar date (YYYY-MM-DD) from which you'd like to start your query.",
                "required": true
            },
            {
                "name": "end_date",
                "display_name": "End Date",
                "type": "text",
                "description": "The calendar date (YYYY-MM-DD) from which you'd like to end your query.",
                "required": true
            }
        ],
        external_scripts:["https://www.dropbox.com/s/xcj6swmplobnur7/dweet.io.js?raw=1"],
        newInstance: function (settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new dweetStorageDatasource(settings, updateCallback));
        }
    });

    var dweetStorageDatasource = function (settings, updateCallback) {
        var self = this;
        var currentSettings = settings;

        var getData = function () {
            currentSettings.session_token ? getDweets() : appendModal();
        }

        var appendModal = function () {
            $("body").append(
                `<div id="modal-overlay">
                    <div class="modal">
                    </div>
                </div>`
            );

            appendHeader();
            appendSection();
            appendFormRow("Username");
            appendFormRow("Password");
            appendFooter();

            $("#modal-overlay").css({
                "position": "absolute",
                "z-index": "100",
                "top": "0",
                "left": "0",
                "height": "100%",
                "width": "100%",
                "background": "rgba(0,0,0,.8)",
                "overflow-y": "auto"
            });

            $("body").on("click", "#login-button", function () {
                login($("input#text").val(), $("input#password").val());
                $("#modal-overlay").remove();
            }); 

            $("body").on("click", "#cancel-button", function () {
                $("#modal-overlay").remove();
            });
        }

        var appendHeader = function () {
            $(".modal").append(`<header><h2 class="title">Dweet.io</h2></header>`);
        }

        var appendSection = function () {
            $(".modal").append(`<section><div id="section-div"></div></section>`);
        }

        var appendFormRow = function (value) {
            var type = value === "Password" ? "password" : "text";

            $("#section-div").append(
                `<div class="form-row">
                    <div class="form-label">
                        <label class="control-label">${value}</label>
                    </div>
                    <div id=${value.toLowerCase()} class="form-value">
                        <input id=${type} type=${type}>
                    </div>
                </div>
            `);
        }

        var appendFooter = function () {
            $(".modal").append(
                `<footer>
                    <span id="login-button" class="text-button">Login</span>
                    <span id="cancel-button" class="text-button">Cancel</span>
                </footer>
            `);
        }

        var login = function (username, password) {
            var data = JSON.stringify({
                "username": username,
                "password": password
            });

            $.ajax({
                type: "POST",
                url: "https://beta.dweet.io:443/v2/users/login",
                dataType: "JSON",
                data: data,
                success: function (payload) {
                    currentSettings.session_token = payload.token;
                    getDweets();
                },
                error: function (e) {
                    console.log(e);
                },
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Content-Type", "application/json");
                }
            });
        }

        var getDweets = function () {
            $.ajax({
                url: `https://beta.dweet.io:443/v2/dweets/range?thing=${currentSettings.thing_name}&from=${currentSettings.start_date}&to=${currentSettings.end_date}`,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("X-DWEET-AUTH", currentSettings.session_token);
                },
                success: function (payload) {
                    updateCallback(formatData(payload.with));
                },
                error: function (e) {
                    appendModal();
                }
            });
        }

        var formatData = function (dweets) {
            var newData = {};
            var date;

            dweets.forEach((dweet) => {
                date = new Date(dweet.created).toLocaleString();
                dweet.created = date;
                newData[date] = dweet;
            });
            
            return newData;
        }

        this.updateNow = function () {
            getData();
        }

        this.onDispose = function () {
        }

        this.onSettingsChanged = function (newSettings) {
            // if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(newSettings.date)) {
            //     freeboard.showDialog($("<div>Invalid Date format!</div>"),"Error","OK",null,null);
            //     return;
            // }
            currentSettings = newSettings;
            self.updateNow();
        }
    };
}());
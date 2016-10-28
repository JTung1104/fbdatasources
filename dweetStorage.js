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
            currentSettings.session_token ? getDweets() : login();
        }

        var appendModal = function () {
            $("body").append(
                `<div id="modal-overlay">
                    <div class="modal">
                        <header><h2 class="title">Dweet.io</h2></header>
                        <section>
                            <div>
                                <div class="form-row>"
                                    <div class="form-label">
                                        <label class="control-label">Username</label>
                                    </div>
                                    <div id="username" class="form-value">
                                        <input type="text">
                                    </div>
                                </div>
                                <div class="form-row>"
                                    <div class="form-label">
                                        <label class="control-label">Password</label>
                                    </div>
                                    <div id="password" class="form-value">
                                        <input type="password">
                                    </div>
                                </div>
                            </div>
                        </section>
                        <footer>
                            <span id="login-button" class="text-button">Login</span>
                            <span id="cancel-button" class="text-button">Cancel</span>
                        </footer>
                    </div>
                </div>`);

            $("body").on("click", "#login-button", function () {
                console.log("CLICKED!");
            });
        }

        var login = function () {
            var data = JSON.stringify({
                "username": currentSettings.username,
                "password": currentSettings.password
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
                    login();
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
            if (!currentSettings.session_token) {appendModal()}
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
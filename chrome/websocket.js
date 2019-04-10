let socket;
let heartbeatCount;

getSettings();

function openSocket(region) {

    socket = new WebSocket("wss://" + region + ".pug.champ.gg/socket.io/?EIO=3&transport=websocket");

    socket.addEventListener("open", function (event) {
        heartbeat();
    });

    socket.addEventListener("message", function (event) {
        onMessage(event);
    });
}

function onMessage(evt) {
    let msg_text = evt.data;
    if (msg_text.includes("launchStatusUpdated")) {
        msg_text = msg_text.replace(/^\d+/, '');    //remove leading numbers from json
        let json_info = JSON.parse(msg_text);             //convert to json

        updatePopup(json_info);

        let amount_of_players = json_info[1].allPlayersAvailable.length;
        updateIcon(amount_of_players);
    }
}

function heartbeat() {
    setTimeout(function () {
        if (socket.readyState == 1) {
            socket.send('42["timesync",{"jsonrpc":"2.0","id":"' + heartbeatCount + '","method":"timesync"}]');
            heartbeatCount++;
        }
        heartbeat()
    }, 4000);
}

function updateIcon(amount_of_players_available) {
    chrome.browserAction.setBadgeText({text: "" + amount_of_players_available});

    if (amount_of_players_available < 12) {          //Transparancy in the colors below doesn't seem to do anything
        chrome.browserAction.setBadgeBackgroundColor({color: [235, 30, 30, 230]}); //red
    } else {
        chrome.browserAction.setBadgeBackgroundColor({color: [30, 235, 30, 230]}); //green
    }
}

function updatePopup(pugchamp_info) {
    let playeramount = pugchamp_info[1].allPlayersAvailable.length;     // Amount of different players added up in total.
    let captainsavailable = pugchamp_info[1].captainsAvailable.length;  // Amount of people added as captain
    let rolesneededamount = pugchamp_info[1].rolesNeeded.length;        // If this is empty then all the roles are filled.
    let holds = pugchamp_info[1].launchHolds;

    info_dict = {
        playeramount: playeramount,
        captainsavailable: captainsavailable,
        rolesneededamount: rolesneededamount,
        holds: holds
    }

    chrome.runtime.sendMessage({
        title: "pugchamp_info",
        content: info_dict
    });


    chrome.storage.sync.set({pugchamp_info: info_dict}, function () {
    });
}

//Recieving end of messages
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        getSettings();
    }
);

function getSettings() {
    chrome.storage.sync.get("settings", function (data) {
        settings = data.settings;
        if (socket != undefined) socket.close();
        heartbeatCount = 1;
        if (settings == undefined) {
            openSocket("eu");
        } else {
            openSocket(settings.region);
        }
    });
}

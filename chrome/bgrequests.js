let userDataCache = [];
let requestQueue = [];
let openRequests = [];
let eseaDivJSON = 0;
let ozfDivJSON = 0;

chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        for (let i = 0; i < msg.idArray.length; i++) {
            returnData(msg.idArray[i], port);
        }
    });
});

async function returnData(id, port) {
    let cachedIDs = [];
    let userData;
    let idPos;

    for (let i = 0; i < userDataCache.length; i++) {
        cachedIDs.push(userDataCache[i].id);
    }
    idPos = cachedIDs.indexOf(id);

    if (idPos != -1) {
        port.postMessage({
            user: userDataCache[idPos]
        });
    } else if (requestQueue.indexOf(id) != -1) {
        openRequests.push({
            id: id,
            port: port
        });
    } else if (requestQueue.indexOf(id) == -1) {
        requestQueue.push(id);
        if (port.name == "eu") {
            userData = await etf2lUserData(id);
            if (userData.registered == false || userData.data.division == null) userData = await eseaUserData(id);
            if (userData.registered == false || userData.data.division == null) userData = await ozfUserData(id);
        } else if (port.name == "na") {
            userData = await eseaUserData(id);
            if (userData.registered == false || userData.data.division == null) userData = await etf2lUserData(id);
            if (userData.registered == false || userData.data.division == null) userData = await ozfUserData(id);
        } else {
            userData = await ozfUserData(id);
            if (userData.registered == false || userData.data.division == null) userData = await eseaUserData(id);
            if (userData.registered == false || userData.data.division == null) userData = await etf2lUserData(id);
        }
        requestQueue.splice(requestQueue.indexOf(id), 1);
        userDataCache.push(userData);
        port.postMessage({
            user: userData
        });
        userDataUpdated(id, userData);
    }
}

function userDataUpdated(id, userData) {
    for (let i = 0; i < openRequests.length; i++) {
        if (openRequests[i].id == id) {
            let port = openRequests[i].port;
            port.postMessage({
                user: userData
            });
            openRequests.splice(i, 1);
            i--;
        }
    }
}

function request(url) {
    return new Promise(resolve => {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "json";
        xhr.setRequestHeader("Accept", "application/json");
        xhr.send();
        xhr.onload = function() {
            resolve(xhr.response);
        }
    });
}

function etf2lUserData(id) {
    return new Promise(async resolve => {
        let userJSON = await request("http://api.etf2l.org/player/" + id);
        if (userJSON.status.code != 404 && userJSON.status.code != 500) {
            let resultJSON = await request("http://api.etf2l.org/player/" + id + "/results/1?since=0");
            let name = userJSON.player.name;
            let etf2lID = userJSON.player.id;
            let team = getTeam(resultJSON);
            let division = getDiv(resultJSON);
            userData = {
                id: id,
                league: "etf2l",
                data: {
                    name: name,
                    team: team,
                    division: division,
                    etf2lID: etf2lID
                },
                registered: true
            }
        } else {
            userData = {
                id: id,
                registered: false
            };
        }
        resolve(userData);
    });

    function getTeam(resultJSON) {
        if (resultJSON.results == null) return null;
        for (let i = 0; i < resultJSON.results.length; i++) {
            let clan1 = resultJSON.results[i].clan1;
            let clan2 = resultJSON.results[i].clan2;
            let category = resultJSON.results[i].competition.category;
            let tier = resultJSON.results[i].division.tier;
            if (category != "6v6 Season" || tier == null) return null;
            if (clan1.was_in_team == 1) {
                return clan1.name;
            } else if (clan2.was_in_team == 1) {
                return clan2.name;
            } else return null;
        }
    }

    function getDiv(resultJSON) {
        if (resultJSON.results == null) return null;
        for (let i = 0; i < resultJSON.results.length; i++) {
            let tier = resultJSON.results[i].division.tier;
            let tierName = resultJSON.results[i].division.name;
            let competitionName = resultJSON.results[i].competition.name;
            let category = resultJSON.results[i].competition.category;
            let clan1 = resultJSON.results[i].clan1;
            let clan2 = resultJSON.results[i].clan2;
            if (!category.includes("6v6 Season")) {} else if (tier != null && (clan1.was_in_team == 1 || clan2.was_in_team == 1)) {
                if (tierName.includes("Division") && tier > 2) {
                    return null;
                } else if (tier == 2) {
                    if (tierName.includes("Division 2")) return 2;
                    return 3;
                } else if (tier >= 3) return tier + 1;
                return tier;
            } else if (competitionName.includes("Playoffs") && (clan1.was_in_team == 1 || clan2.was_in_team == 1)) {
                if (competitionName.includes("Division 1")) {
                    return 1;
                } else if (competitionName.includes("High")) {
                    return 1;
                } else if (competitionName.includes("Division 2")) {
                    return 2;
                } else if (competitionName.includes("Mid")) {
                    return 3;
                } else if (competitionName.includes("Low")) {
                    return 4;
                } else if (competitionName.includes("Open")) {
                    return 5;
                }
            }
        }
        return null;
    }
}

function eseaUserData(id) {
    return new Promise(async resolve => {
        if (eseaDivJSON == 0) eseaDivJSON = await request("https://raw.githubusercontent.com/minicircle/esea_tf2_data/master/esea_data_full.json");
        let division = getDiv(eseaDivJSON, id);
        if (division == null) userData = {
            id: id,
            registered: false
        };
        userData = {
            id: id,
            league: "esea",
            data: {
                division: division
            },
            registered: true
        }
        resolve(userData);
    });

    function getDiv(divJSON, id) {
        let ids = Object.keys(divJSON);
        let idPos = ids.indexOf(id)

        if (idPos == -1) return null;

        let division = divJSON[ids[idPos]];
        if (division.includes("Invite")) {
            return "esea_inv";
        }
        if (division.includes("Intermediate")) {
            return "esea_im";
        }
        if (division.includes("Open")) {
            return "esea_open";
        }
    }
}

function ozfUserData(id) {
    return new Promise(async resolve => {
        if (ozfDivJSON == 0) ozfDivJSON = await request("https://gist.githubusercontent.com/kodeeey/56c5bc0247790f48f212cd1f9b7d175f/raw/05f3725a8e66b22009023abdec637936e07a16fa/ozfortress_divs.json");
        let division = getDiv(ozfDivJSON, id);
        if (division == null) userData = {
            id: id,
            registered: false
        };
        userData = {
            id: id,
            league: "ozf",
            data: {
                division: division
            },
            registered: true
        }
        resolve(userData);
    });

    function getDiv(ozfDivJSON, id) {
        let ids = Object.keys(ozfDivJSON);
        let idPos = ids.indexOf(id)

        if (idPos == -1) return null;

        let division = divJSON[ids[idPos]];
        if (division.includes("premier")) {
            return "ozf_prem";
        } else if (division.includes("intermediate")) {
            return "ozf_im";
        } else if (division.includes("open")) {
            return "ozf_open";
        }
    }
}

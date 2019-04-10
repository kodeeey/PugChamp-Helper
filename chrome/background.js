chrome.runtime.onInstalled.addListener(function () {
    loadSettings();
});

function loadSettings() {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            let response = JSON.parse(xhr.response);
            chrome.storage.sync.set({
                colors: response.colors,
                querystrings: response.querystrings,
                settings: response.settings
            });
        }
    }
    xhr.open("GET", chrome.extension.getURL("/res/cfg/config.json"), true);
    xhr.send();
}

// Contains the code for the popup user interface.
// Users will be able to disable and enable color coding and automatic name substitutions

//Colors for buttons
const colorSelected = "#4caf50";
const colorUnselected = "#9E9E9E";
let regionButtonMap = {};
let settings;

//load stylesheet
style = document.createElement("link");
style.rel = "stylesheet";
style.type = "text/css";
style.href = chrome.extension.getURL("res/css/popup.css");
document.head.appendChild(style);

togglebutton = document.createElement("link");
togglebutton.rel = "stylesheet";
togglebutton.type = "text/css";
togglebutton.href = chrome.extension.getURL("res/css/togglebutton.css");
document.head.appendChild(togglebutton);

// This has to be in a onload block so it only executes when the html is loaded, otherwise the elements don't exist yet and can't be found.
window.onload = function () {
  let divTagToggle = document.getElementById('divTagToggle');
  //let btnNameSubstitution = document.getElementById('btnNameSubstitution');
  let btnRegionEU = document.getElementById('btnRegionEU');
  let btnRegionNA = document.getElementById('btnRegionNA');
  let btnRegionAU = document.getElementById('btnRegionAU');

  regionButtonMap = {"eu": btnRegionEU, "na": btnRegionNA, "au": btnRegionAU};
  let regionButtons = [btnRegionAU, btnRegionEU, btnRegionNA];

  getSettings();

  //functions to manipulate region buttons
  //Remove selection class from all buttons
  function clearSelection() {
    for (let i = 0; i < regionButtons.length; i++) {
      unselectButton(regionButtons[i]);
    }
  }

  function unselectButton(button) {
    if (button.classList.contains('selected')) {
      button.classList.remove('selected');
    }
    button.classList.add('unselected');
  }

  //Change color to indicate which is selected (can also be done with bootstrap button groups, something for later?)
  function selectRegionButton(button) {
    clearSelection();

    button.classList.add('selected');
    button.classList.remove('unselected');
  }

  function updateDivToggle(isEnabled, toggleElement){
    $(toggleElement).prop("checked", isEnabled);
  }


  btnRegionEU.onclick = function () {
    settings.region = "eu";
    setSettings();
    settingsUpdated();
    selectRegion("eu");
  };

  btnRegionNA.onclick = function () {
    settings.region = "na";
    setSettings();
    settingsUpdated();
    selectRegion("na");
  };

  btnRegionAU.onclick = function () {
    settings.region = "au";
    setSettings();
    settingsUpdated();
    selectRegion("au");
  };


  divTagToggle.onclick = function () {
    settings.divTags = !settings.divTags;
    updateDivToggle(settings.divTags, divTagToggle);
    setSettings();
  };

  /*btnNameSubstitution.onclick = function () {
    settings.nameSubstitution = !settings.nameSubstitution;
    updateButton(settings.nameSubstitution, btnNameSubstitution);
    setSettings();
  };*/

  function selectRegion(region) {
    selectRegionButton(regionButtonMap[region]);
  }

  function getSettings() {
    chrome.storage.sync.get("settings", function (data) {
      settings = data.settings;
      updateDivToggle(settings.divTags, divTagToggle);
      selectRegion(settings.region);
    });
    chrome.storage.sync.get("pugchamp_info", function (info_dict) {
      setLaunchstatus(info_dict.pugchamp_info);
    });
  }

  function setSettings() {
    chrome.storage.sync.set({ settings: settings }
      , function () {});
  }
}


//Recieving end of Websocket to popup messages
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.title == "pugchamp_info") {
      setLaunchstatus(request.content);
    }
  }
);

function setHoldsIcons(icon, boolean_isHolding){
  checkmark='<img src="/res/images/icons8-checkmark.svg" alt="Tick" class="img-wrap">';
  cross='<img src="/res/images/icons8-delete-filled.svg" alt="Tick" class="img-wrap">';

  if (boolean_isHolding) {
    icon.html(checkmark);
  } else {
    icon.html(cross);
  }
}

function setLaunchstatus(info_dict) {
  if (typeof info_dict !== 'undefined'){
    $("#captains_amount").text(info_dict.captainsavailable + "/2");
    $("#players_amount").text(info_dict.playeramount + "/12");

    setHoldsIcons($("#roles_ready"), ! info_dict.holds.includes("availablePlayerRoles"));
    setHoldsIcons($("#servers_ready"), ! info_dict.holds.includes("availableServers")); //TODO: These are wrong ATM, still have to check site to find correct name
    setHoldsIcons($("#draft_ready"), ! info_dict.holds.includes("inactiveDraft"));
  }
}

//Send message
function settingsUpdated() {
  chrome.runtime.sendMessage({ greetings: "hello" });
}

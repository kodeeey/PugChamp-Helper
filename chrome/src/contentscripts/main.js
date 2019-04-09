let colors;
let querystrings;
let settings;
let region = document.URL.substring(document.URL.indexOf("/") + 2, document.URL.indexOf("/") + 4);

chrome.storage.sync.get(["colors", "querystrings", "settings"], function(result) {

  colors = result.colors;
  settings = result.settings;
  querystrings = result.querystrings;
  let draftTables = document.getElementsByClassName(querystrings.draftTables);
  let queueTables = document.getElementsByClassName(querystrings.queueTables);

  if (settings.divTags) document.addEventListener("loaded", function(event) {
    let style = document.createElement("link");
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = chrome.extension.getURL("res/css/divTag.css");
    document.head.appendChild(style);

    for (let i = 0; i < queueTables.length; i++) {
      updateTable(queueTables[i].getElementsByClassName(querystrings.queuePlayerElement));
      addMutationObserver(queueTables[i], "queue")
    }
    for (let j = 0; j < draftTables.length; j++) {
      updateTable(draftTables[j].getElementsByClassName(querystrings.draftPlayerElement));
      addMutationObserver(draftTables[j], "draft")
    }
  });
});

function addMutationObserver(target, type) {
  let config = {childList: true, attributes: true, subtree:true};
  if (type == "draft") config = {childList: true, attributes: true, subtree: true};

  let observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (type == "queue") {
        queueMutation(mutation, target);
      } else {
        draftMutation(mutation, target);
      }
    });
  });
  observer.observe(target, config);

  function queueMutation(mutation, target) {
    if (mutation.removedNodes[0] != undefined && mutation.removedNodes[0].nodeName == "PAPER-ICON-ITEM") {
      updateTable(target.getElementsByClassName(querystrings.queuePlayerElement));
    }
    if (mutation.addedNodes[1] != undefined && mutation.addedNodes[1].nodeName == "PAPER-ICON-ITEM") {
      updateTable([mutation.addedNodes[1]]);
    }
  }

  function draftMutation(mutation, target) {
    if (mutation.addedNodes[1] != undefined && mutation.addedNodes[1].nodeName == "PAPER-ICON-ITEM") {
      updateTable([mutation.addedNodes[1]]);
    }
    if (mutation.type == "childList" && mutation.target.className == querystrings.button) {
        updateTable([mutation.target.parentNode]);
    }
  }
}

function updateTable(elements) {
  let idArray = getIds(elements);
  let port = chrome.runtime.connect({name: region});
  port.postMessage({idArray: idArray});
  port.onMessage.addListener(function(msg) {
    for (let i = 0; i < elements.length; i++) {
      elementID = elements[i].children[1].firstElementChild.getAttribute("href").substring(8);
      if (elementID != null) {
        if (msg.user.id == elementID) {
          if (msg.user.registered) {
            updateUser(elements[i], msg.user.data.division, msg.user.data.etf2lID)
          } else {
            updateUser(elements[i], null, null)
          }
        }
      }
    }
  });
}

function updateUser(targetElement, div, id) {
  let tag = targetElement.getElementsByClassName("etf2lDivTag")[0];
  let href = null;
  if (id != null) href = "http://etf2l.org/forum/user/" + id;
  if (tag == null) {
    tag = document.createElement("a");
    tag.className = "etf2lDivTag";
    if (href != null) {
      tag.setAttribute("href", href);
      tag.setAttribute("target", "_blank")
    }
    targetElement.firstElementChild.appendChild(tag);
    tag.style.color = "black";
  } else {
    tag.removeAttribute("href");
    if (href != null) {
      tag.setAttribute("href", href);
    }
  }

  switch(div) {
  case 0:
      tag.style.background = colors.prem;
      tag.innerText = "PREM"
      break;
  case 1:
      tag.style.background = colors.div1;
      tag.innerText = "DIV1"
      break;
  case 2:
      tag.style.background = colors.div2;
      tag.innerText = "DIV2"
      break;
  case 3:
      tag.style.background = colors.mid;
      tag.innerText = "MID"
      break;
  case 4:
      tag.style.background = colors.low;
      tag.innerText = "LOW"
      break;
  case 5:
      tag.style.background = colors.open;
      tag.innerText = "OPEN"
      break;
  case "esea_inv":
      tag.style.background = colors.prem;
      tag.innerText = "INV"
      break;
  case "esea_im":
      tag.style.background = colors.div1;
      tag.innerText = "IM"
      break;
  case "esea_open":
      tag.style.background = colors.div2;
      tag.innerText = "OPEN"
      break;
  case "ozf_prem":
      tag.style.background = colors.prem;
      tag.innerText = "PREM"
      break;
  case "ozf_im":
      tag.style.background = colors.div1;
      tag.innerText = "IM"
      break;
  case "ozf_open":
      tag.style.background = colors.div2;
      tag.innerText = "OPEN"
      break;
  case null:
      tag.style.background = colors.null;
      tag.innerText = "NERD"
      break;
    }
}

function getIds(targetTable) {
    let idArray = [];
    for (let i = 0; i < targetTable.length; i++) {
      let id = targetTable[i].children[1].firstElementChild.getAttribute("href").substring(8);
        if (! idArray.includes(id)) {
            idArray.push(id);
        }
    }
    return idArray;
}

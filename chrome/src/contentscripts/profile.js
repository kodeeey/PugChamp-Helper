document.addEventListener("loaded", function (event) {
    let temp = document.URL.indexOf("/");
    let region = document.URL.substring(temp + 2, temp + 4);
    let id = document.URL.substring(document.URL.length - 17, document.URL.length);
    let port = chrome.runtime.connect({name: region});
    port.postMessage({idArray: [id]});
    port.onMessage.addListener(function (msg) {
        if (msg.user.id == id && msg.user.registered) {
            let main = document.getElementById("mainContainer").children[0];
            let buttonOuterHTML = document.createElement("a");
            let buttonInnerHTML = main.getElementsByClassName("link x-scope paper-button-0")[1];
            buttonInnerHTML = buttonInnerHTML.cloneNode(true);
            main.appendChild(buttonOuterHTML);
            buttonOuterHTML.className = "button";
            buttonOuterHTML.setAttribute("href", "http://etf2l.org/forum/user/" + msg.user.data.etf2lID)
            buttonOuterHTML.setAttribute("target", "_blank")
            buttonInnerHTML.innerText = "ETF2L Profile";
            buttonOuterHTML.appendChild(buttonInnerHTML);
            buttonOuterHTML.style.position = "absolute";
            buttonOuterHTML.style.left = 440 + 'px';
            buttonOuterHTML.style.top = 144 + 'px';
        }
    });
});

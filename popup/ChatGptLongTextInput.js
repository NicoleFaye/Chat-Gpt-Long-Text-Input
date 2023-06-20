var config = {};
var defaultValues = {};

async function getConfig() {
  // Check if default values are already stored in local storage
  if (localStorage.getItem('defaultMainPrompt') && localStorage.getItem('defaultMessagePrepend') && localStorage.getItem('defaultMessageAppend') && localStorage.getItem("defaultMaxMessageLength") && localStorage.getItem("defaultFinalPrompt")) {
  
    defaultValues = {
      textToImport: "",
      mainPrompt: localStorage.getItem('defaultMainPrompt'),
      messagePrepend: localStorage.getItem('defaultMessagePrepend'),
      messageAppend: localStorage.getItem('defaultMessageAppend'),
      textToImportHeight: document.getElementById("textInput").getAttribute("height"),
      maxMessageLength: localStorage.getItem("defaultMaxMessageLength"),
      useFinalPrompt: localStorage.getItem("defaultUseFinalPrompt"),
      finalPrompt: localStorage.getItem("defaultFinalPrompt"),
    };
  } else {
    // Otherwise, fetch default values from config.json
    getJsonConfig();
  }
}

async function getJsonConfig() {
  const response = await fetch(browser.runtime.getURL('config.json'));
  const newConfig = await response.json();
  config = newConfig;
  defaultValues = {
    textToImport: "",
    mainPrompt: config.mainPrompt,
    messagePrepend: config.messagePrepend,
    messageAppend: config.messageAppend,
    textToImportHeight: document.getElementById("inputText").getAttribute("height"),
    maxMessageLength: config.maxMessageLength,
    useFinalPrompt: config.useFinalPrompt,
    finalPrompt: config.finalPrompt,
  };
  localStorage.setItem('defaultMainPrompt', defaultValues.mainPrompt);
  localStorage.setItem('defaultMessagePrepend', defaultValues.messagePrepend);
  localStorage.setItem('defaultMessageAppend', defaultValues.messageAppend);
  localStorage.setItem('defaultMaxMessageLength', defaultValues.maxMessageLength);
  localStorage.setItem('defaultUseFinalPrompt', defaultValues.useFinalPrompt);
  localStorage.setItem('defaultFinalPrompt', defaultValues.finalPrompt);
}

getConfig();

const settingsButton = document.getElementById("settings-button");
const settingsContent = document.getElementById("settings-content");
const popupContent = document.getElementById("popup-content");




function resetInputs() {
  document.getElementById("textInput").value = defaultValues.textToImport;
  document.getElementById("mainPrompt").value = defaultValues.mainPrompt;
  document.getElementById("messagePrepend").value = defaultValues.messagePrepend;
  document.getElementById("messageAppend").value = defaultValues.messageAppend;
  document.getElementById("finalPrompt").value = defaultValues.finalPrompt;
  document.getElementById("textArea").setAttribute("height", defaultValues.textToImportHeight)
}


function showConfirmationPopupOkay(message) {
  return new Promise((resolve, reject) => {
    const popup = document.createElement("div");
    popup.classList.add("confirmation-popup");

    const popupMessage = document.createElement("p");
    popupMessage.classList.add("confirmation-text");
    popupMessage.textContent = message;
    popup.appendChild(popupMessage);

    const okayButton = document.createElement("button");
    okayButton.textContent = "Okay";
    okayButton.classList.add("centered-button");
    okayButton.addEventListener("click", () => {
      popup.remove();
      resolve();
    });
    popup.appendChild(okayButton);

    document.body.appendChild(popup);

    // Position the popup in the center of the screen
    const popupWidth = popup.offsetWidth;
    const popupHeight = popup.offsetHeight;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    popup.style.left = (screenWidth - popupWidth) / 2 + "px";
    popup.style.top = (screenHeight - popupHeight) / 2 + "px";
  });
}

function showConfirmationPopupYesNo(message) {
  return new Promise((resolve, reject) => {
    const popup = document.createElement("div");
    popup.classList.add("confirmation-popup");

    const popupMessage = document.createElement("p");
    popupMessage.classList.add("confirmation-text");
    popupMessage.textContent = message;
    popup.appendChild(popupMessage);

    const yesButton = document.createElement("button");
    yesButton.textContent = "Yes";
    yesButton.addEventListener("click", () => {
      popup.remove();
      resolve("yes");
    });
    popup.appendChild(yesButton);

    const noButton = document.createElement("button");
    noButton.textContent = "No";
    noButton.addEventListener("click", () => {
      popup.remove();
      resolve("no");
    });
    popup.appendChild(noButton);

    document.body.appendChild(popup);

    // Position the popup in the center of the screen
    const popupWidth = popup.offsetWidth;
    const popupHeight = popup.offsetHeight;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    popup.style.left = (screenWidth - popupWidth) / 2 + "px";
    popup.style.top = (screenHeight - popupHeight) / 2 + "px";
  });
}

function isPopupOpen() {
  return document.querySelector(".confirmation-popup") !== null;
}


/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
  document.addEventListener("click", (e) => {
    function run(tabs) {
      browser.tabs.sendMessage(tabs[0].id, {
        command: "run",
        maxMessageLength: localStorage.getItem("defaultMaxMessageLength"),
        textToImport: document.getElementById("textInput").value,
        mainPrompt: document.getElementById("mainPrompt").value,
        messagePrepend: document.getElementById("messagePrepend").value,
        messageAppend: document.getElementById("messageAppend").value,
        useFinalPrompt: "false",
        //useFinalPrompt: localStorage.getItem("defaultFinalPrompt"),
        finalPrompt: document.getElementById("finalPrompt").value,
      });
    }


    function reset(tabs) {
      resetInputs();
        browser.tabs.sendMessage(tabs[0].id, {
          command: "stop",
        }).catch(reportError);
    }


    if (e.target.tagName !== "BUTTON" || isPopupOpen() || !(e.target.closest("#popup-content") || e.target.closest("#settings-content"))) {
      // Ignore when click is not on a button within <div id="popup-content"> etc
      return;
    }
    if (e.target.id === "settings-button") {
      settingsContent.classList.toggle("show");
      document.getElementById("defaultMainPrompt").value = defaultValues.mainPrompt;
      document.getElementById("defaultPrepend").value = defaultValues.messagePrepend;
      document.getElementById("defaultAppend").value = defaultValues.messageAppend;
      document.getElementById("defaultMaxMessageLength").value = defaultValues.maxMessageLength;
      document.getElementById("defaultFinalPrompt").value = defaultValues.finalPrompt;
    }
    else if (e.target.id === "close-button") {
      settingsContent.classList.toggle("show");
    }
    else if (e.target.id === "file-button") {
        browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
          browser.tabs.sendMessage(tabs[0].id, {
            command: "file-pick",
        }).catch(()=>{
          showConfirmationPopupOkay("Try again with ChatGpt open.");
        });
        }).catch((error) => {
          reportError(error);
        });
    }
    else if (e.target.id === "save-button") {
      settingsContent.classList.toggle("show");
      defaultValues.mainPrompt = document.getElementById("defaultMainPrompt").value;
      defaultValues.messagePrepend = document.getElementById("defaultPrepend").value;
      defaultValues.messageAppend = document.getElementById("defaultAppend").value;
      defaultValues.maxMessageLength = document.getElementById("defaultMaxMessageLength").value;
      defaultValues.finalPrompt= document.getElementById("defaultFinalPrompt").value;
      localStorage.setItem('defaultMainPrompt', defaultValues.mainPrompt);
      localStorage.setItem('defaultMessagePrepend', defaultValues.messagePrepend);
      localStorage.setItem('defaultMessageAppend', defaultValues.messageAppend);
      localStorage.setItem('defaultMaxMessageLength', defaultValues.maxMessageLength);
      localStorage.setItem('defaultFinalPrompt', defaultValues.finalPrompt);
    }
    else if (e.target.id === "hard-reset-button") {
      showConfirmationPopupYesNo("Are you sure you want to restore the original default values?").then((response) => {
        if (response === "yes") {
          getJsonConfig().then(() => {
            document.getElementById("defaultMainPrompt").value = defaultValues.mainPrompt;
            document.getElementById("defaultPrepend").value = defaultValues.messagePrepend;
            document.getElementById("defaultAppend").value = defaultValues.messageAppend;
            document.getElementById("defaultFinalPrompt").value = defaultValues.finalPrompt;
            document.getElementById("defaultMaxMessageLength").value=defaultValues.maxMessageLength;
            settingsContent.classList.toggle("show");
          }
          );
        }
      }).catch((err) => {
        console.error(err);
      });
    }
    else if (e.target.id === "reset-button") {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(reset)
        .catch(reportError);
    } else {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(run)
        .catch(reportError);
    }
  });

}

//listener ensure values stay persistent when the popup closes
window.addEventListener("visibilitychange", (event) => {
  var data = {
    textToImport: document.getElementById("textInput").value,
    mainPrompt: document.getElementById("mainPrompt").value,
    messagePrepend: document.getElementById("messagePrepend").value,
    messageAppend: document.getElementById("messageAppend").value,
    finalPrompt: document.getElementById("finalPrompt").value,
  };
  localStorage.setItem("popupData", JSON.stringify(data));
});


/**
 * Ensures that when you open the popup after it closes, it is still the same
 */
var storedData = JSON.parse(localStorage.getItem("popupData"));
if (storedData !== null) {
  document.getElementById("textInput").value = storedData.textToImport;
  document.getElementById("mainPrompt").value = storedData.mainPrompt;
  document.getElementById("messagePrepend").value = storedData.messagePrepend;
  document.getElementById("messageAppend").value = storedData.messageAppend;
  document.getElementById("finalPrompt").value = storedData.finalPrompt;
}


browser.runtime.onMessage.addListener((message) => {
  if (message.command === "file-get") {
    const fileContent = message.content;
    if (fileContent !== "")
      document.getElementById("textInput").value = fileContent;
  }
});


function reportError(err) {
  //console.error(err);
}


function handleBrowserAction() {
  browser.tabs.query({ active: true, currentWindow: true })
    .then(injectScript);
  listenForClicks();
}
function injectScript(tabs) {
  try{
  browser.tabs.executeScript(tabs[0].id, {file: "/content_scripts/ChatGptLongTextInputContentScript.js"});
  browser.tabs.sendMessage(tabs[0].id, { command: "file-get" }).catch(reportError);
  }
  catch(error){
    reportError(error);
  }
}


handleBrowserAction();
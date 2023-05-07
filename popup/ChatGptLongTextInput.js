// Load the JSON config file
var config = {};
var defaultValues = {};
var error = false;

async function getConfig() {
  // Check if default values are already stored in local storage
  if (localStorage.getItem('defaultMainPrompt') && localStorage.getItem('defaultMessagePrepend') && localStorage.getItem('defaultMessageAppend')) {
    defaultValues = {
      textToImport: "",
      mainPrompt: localStorage.getItem('defaultMainPrompt'),
      messagePrepend: localStorage.getItem('defaultMessagePrepend'),
      messageAppend: localStorage.getItem('defaultMessageAppend'),
      textToImportHeight: document.body.getElementsByTagName("textArea")[0].getAttribute("height"),
    };
  } else {
    // Otherwise, fetch default values from config.json
    const response = await fetch(browser.runtime.getURL('config.json'));
    const newConfig = await response.json();
    config = newConfig;
    defaultValues = {
      textToImport: "",
      mainPrompt: config.mainPrompt,
      messagePrepend: config.messagePrepend,
      messageAppend: config.messageAppend,
      textToImportHeight: document.body.getElementsByTagName("textArea")[0].getAttribute("height"),
    };
    localStorage.setItem('defaultMainPrompt', defaultValues.mainPrompt);
    localStorage.setItem('defaultMessagePrepend', defaultValues.messagePrepend);
    localStorage.setItem('defaultMessageAppend', defaultValues.mainPrompt);
  }
}


/*
async function getConfig() {
  const response = await fetch(browser.runtime.getURL('config.json'));
  const newConfig = await response.json();
  config = newConfig;
  defaultValues = {
    textToImport: "",
    mainPrompt: config.mainPrompt,
    messagePrepend: config.messagePrepend,
    messageAppend: config.messageAppend,
    textToImportHeight: document.body.getElementsByTagName("textArea")[0].getAttribute("height"),
  }
}
*/
getConfig();


const settingsButton = document.getElementById("settings-button");
const settingsContent = document.getElementById("settings-content");
const popupContent = document.getElementById("popup-content");



function resetInputs() {
  document.body.getElementsByTagName("textarea")[0].value = defaultValues.textToImport;
  document.body.getElementsByTagName("input")[0].value = defaultValues.mainPrompt;
  document.body.getElementsByTagName("input")[1].value = defaultValues.messagePrepend;
  document.body.getElementsByTagName("input")[2].value = defaultValues.messageAppend;
  document.body.getElementsByTagName("textArea")[0].setAttribute("height", defaultValues.textToImportHeight)
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
        textToImport: document.body.getElementsByTagName("textarea")[0].value,
        mainPrompt: document.body.getElementsByTagName("input")[0].value,
        messagePrepend: document.body.getElementsByTagName("input")[1].value,
        messageAppend: document.body.getElementsByTagName("input")[2].value,
      });
    }


    function reset(tabs) {
      resetInputs();
      browser.tabs.sendMessage(tabs[0].id, {
        command: "stop",
      });
    }

    /**
     * Just log the error to the console.
     */
    function reportError(error) {
      console.error(`Error: ${error}`);
    }

    if (e.target.tagName !== "BUTTON" || !(e.target.closest("#popup-content") || e.target.closest("#settings-content"))) {
      // Ignore when click is not on a button within <div id="popup-content">.
      return;
    }
    if (e.target.id === "settings-button") {
      settingsContent.classList.toggle("show");
      document.getElementById("defaultMainPrompt").value = defaultValues.mainPrompt;
      document.getElementById("defaultPrepend").value = defaultValues.messagePrepend;
      document.getElementById("defaultAppend").value = defaultValues.messageAppend;
    }
    else if (e.target.id === "close-button") {
      settingsContent.classList.toggle("show");
    }
    else if (e.target.id === "save-button") {
      settingsContent.classList.toggle("show");
      defaultValues.mainPrompt = document.getElementById("defaultMainPrompt").value;
      defaultValues.messagePrepend = document.getElementById("defaultPrepend").value;
      defaultValues.messageAppend = document.getElementById("defaultAppend").value;
      localStorage.setItem('defaultMainPrompt', defaultValues.mainPrompt);
      localStorage.setItem('defaultMessagePrepend', defaultValues.messagePrepend);
      localStorage.setItem('defaultMessageAppend', defaultValues.mainPrompt);
    }
    else if (e.target.id === "reset-button") {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(reset)
        .catch(reportError);
    } else if (!error) {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(run)
        .catch(reportError);
    }
  });

}

//listener ensure values stay persistent when the popup closes
window.addEventListener("visibilitychange", (event) => {
  var data = {
    textToImport: document.body.getElementsByTagName("textarea")[0].value,
    mainPrompt: document.body.getElementsByTagName("input")[0].value,
    messagePrepend: document.body.getElementsByTagName("input")[1].value,
    messageAppend: document.body.getElementsByTagName("input")[2].value,
  };
  localStorage.setItem("popupData", JSON.stringify(data));
});


/**
 * Ensures that when you open the popup after it closes, it is still the same
 */
var storedData = JSON.parse(localStorage.getItem("popupData"));
if (storedData !== null) {
  document.body.getElementsByTagName("textarea")[0].value = storedData.textToImport;
  document.body.getElementsByTagName("input")[0].value = storedData.mainPrompt;
  document.body.getElementsByTagName("input")[1].value = storedData.messagePrepend;
  document.body.getElementsByTagName("input")[2].value = storedData.messageAppend;
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  //document.querySelector("#popup-content").classList.add("hidden");
  //document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute content script: ${error.message}`);
  error = true;
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */

browser.tabs.executeScript({ file: "/content_scripts/ChatGptLongTextInputContentScript.js" })
  .then(listenForClicks)
  .catch(reportExecuteScriptError);
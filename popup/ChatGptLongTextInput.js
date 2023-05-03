// Load the JSON config file
var config = {};
var defaultValues = {};

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
getConfig();


/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
  document.addEventListener("click", (e) => {
    function run(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        command: "run",
        textToImport: document.body.getElementsByTagName("textarea")[0].value,
        mainPrompt: document.body.getElementsByTagName("input")[0].value,
        messagePrepend: document.body.getElementsByTagName("input")[1].value,
        messageAppend: document.body.getElementsByTagName("input")[2].value,
      });
    }

    function reset(tabs) {
      document.body.getElementsByTagName("textarea")[0].value = defaultValues.textToImport;
      document.body.getElementsByTagName("input")[0].value = defaultValues.firstMessage;
      document.body.getElementsByTagName("input")[1].value = defaultValues.secondMessage;
      document.body.getElementsByTagName("textArea")[0].setAttribute("height", defaultValues.textToImportHeight)
      chrome.tabs.sendMessage(tabs[0].id, {
        command: "stop",
      });

    }

    /**
     * Just log the error to the console.
     */
    function reportError(error) {
      console.error(`Error: ${error}`);
    }

    if (e.target.tagName !== "BUTTON" || !e.target.closest("#popup-content")) {
      // Ignore when click is not on a button within <div id="popup-content">.
      return;
    }
    if (e.target.type === "reset") {
      chrome.tabs.query({ active: true, currentWindow: true })
        .then(reset)
        .catch(reportError);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true })
        .then(run)
        .catch(reportError);
    }
  });
}

window.addEventListener("visibilitychange", (event) => {
  var data = {
    textToImport: document.body.getElementsByTagName("textarea")[0].value,
    mainPrompt: document.body.getElementsByTagName("input")[0].value,
    messagePrepend: document.body.getElementsByTagName("input")[1].value,
    messageAppend: document.body.getElementsByTagName("input")[2].value,
    textToImportHeight: document.body.getElementsByTagName("textArea")[0].getAttribute("height"),
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
} else {
  resetInputs();
}



/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error) {
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  console.error(`Failed to execute content script: ${error.message}`);
}

//Chrome inject method 
function injectScript(tabs) {
  chrome.scripting.executeScript({
    target: { tabId: tabs[0].id },
    files: ["/content_scripts/ChatGptLongTextInputContentScript.js"]
  })
    .then(listenForClicks)
    .catch(reportExecuteScriptError);
}

//Chrome inject method
chrome.tabs.query({ active: true, currentWindow: true })
  .then(injectScript)
  .catch(reportError)
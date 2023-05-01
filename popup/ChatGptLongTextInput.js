//get default values from html file because somehow that felt like less work than just extracting them out into here.
var defaultValues = {
        textToImport: document.body.getElementsByTagName("textarea")[0].value,
        firstMessage: document.body.getElementsByTagName("input")[0].value,
        secondMessage: document.body.getElementsByTagName("input")[1].value,
        textToImportHeight: document.body.getElementsByTagName("textArea")[0].getAttribute("height"),
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
        firstMessage: document.body.getElementsByTagName("input")[0].value,
        secondMessage: document.body.getElementsByTagName("input")[1].value,
      });
    }

    function reset(tabs){
        document.body.getElementsByTagName("textarea")[0].value=defaultValues.textToImport;
        document.body.getElementsByTagName("input")[0].value=defaultValues.firstMessage;
        document.body.getElementsByTagName("input")[1].value=defaultValues.secondMessage;
        document.body.getElementsByTagName("textArea")[0].setAttribute("height",defaultValues.textToImportHeight)
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

    if (e.target.tagName !== "BUTTON" || !e.target.closest("#popup-content")) {
      // Ignore when click is not on a button within <div id="popup-content">.
      return;
    }
    if (e.target.type === "reset") {
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
  window.addEventListener("visibilitychange", (event) => {
    var data = {
      textToImport: document.body.getElementsByTagName("textarea")[0].value,
      firstMessage: document.body.getElementsByTagName("input")[0].value,
      secondMessage: document.body.getElementsByTagName("input")[1].value,
      textToImportHeight: document.body.getElementsByTagName("textArea")[0].getAttribute("height"),
    };
    localStorage.setItem("popupData", JSON.stringify(data));
  });

  var storedData = JSON.parse(localStorage.getItem("popupData"));
  if (storedData !== null) {
    document.body.getElementsByTagName("textarea")[0].value = storedData.textToImport;
    document.body.getElementsByTagName("input")[0].value = storedData.firstMessage;
    document.body.getElementsByTagName("input")[1].value = storedData.secondMessage;
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

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */

browser.tabs.executeScript({ file: "/content_scripts/ChatGptLongTextInputContentScript.js" })
  .then(listenForClicks)
  .catch(reportExecuteScriptError);
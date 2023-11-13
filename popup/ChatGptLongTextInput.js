import splitString from "../content_scripts/ChatGptLongTextInputSharedMethods.js";
var config = {};
var defaultValues = {};
var totalMessages = 0;

function determineNumberOfMessages(textToImport, maxMessageLength, useFinalPrompt) {
  let subStrings = splitString(textToImport, maxMessageLength, localStorage.getItem("defaultSplitOnLineBreaks") === 'true');
  let numberOfMessages = subStrings.length;
  // Add one for the mainPrompt message
  numberOfMessages++;

  // Add one more if useFinalPrompt is set to true
  if (useFinalPrompt.toLowerCase() === "true") {
    numberOfMessages++;
  }

  return numberOfMessages;
}


function updateTotalMessagesElement() {
  document.getElementById("messageCount").textContent = totalMessages.toString() + " Total messages";
}
function updateTotalMessages() {
  totalMessages = determineNumberOfMessages(document.getElementById("textInput").value, localStorage.getItem("defaultMaxMessageLength"), localStorage.getItem("defaultUseFinalPrompt"));
  updateTotalMessagesElement();
}

async function getConfig() {
  // Check if default values are already stored in local storage
  if (localStorage.getItem('defaultMainPrompt') && localStorage.getItem('defaultMessagePrepend') && localStorage.getItem('defaultMessageAppend') && localStorage.getItem("defaultMaxMessageLength") && localStorage.getItem("defaultFinalPrompt")) {

    defaultValues = {
      textToImport: "",
      mainPrompt: localStorage.getItem('defaultMainPrompt'),
      messagePrepend: localStorage.getItem('defaultMessagePrepend'),
      messageAppend: localStorage.getItem('defaultMessageAppend'),
      maxMessageLength: localStorage.getItem("defaultMaxMessageLength"),
      useFinalPrompt: localStorage.getItem("defaultUseFinalPrompt"),
      finalPrompt: localStorage.getItem("defaultFinalPrompt"),
      splitOnLineBreaks: localStorage.getItem("defaultSplitOnLineBreaks"),
    };
  } else {
    // Otherwise, fetch default values from config.json
    await getJsonConfig();
  }
  updateFinalMessageDisplay();
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
    maxMessageLength: config.maxMessageLength,
    useFinalPrompt: config.useFinalPrompt,
    finalPrompt: config.finalPrompt,
    splitOnLineBreaks: config.splitOnLineBreaks,
  };
  localStorage.setItem('defaultMainPrompt', defaultValues.mainPrompt);
  localStorage.setItem('defaultMessagePrepend', defaultValues.messagePrepend);
  localStorage.setItem('defaultMessageAppend', defaultValues.messageAppend);
  localStorage.setItem('defaultMaxMessageLength', defaultValues.maxMessageLength);
  localStorage.setItem('defaultUseFinalPrompt', defaultValues.useFinalPrompt);
  localStorage.setItem('defaultFinalPrompt', defaultValues.finalPrompt);
  localStorage.setItem('defaultSplitOnLineBreaks', defaultValues.splitOnLineBreaks);
}

getConfig();

const settingsButton = document.getElementById("settings-button");
const settingsContent = document.getElementById("settings-content");
const popupContent = document.getElementById("popup-content");





function updateFinalMessageDisplay() {
  if (localStorage.getItem('defaultUseFinalPrompt') === 'true') {
    document.getElementById("FinalPromptDiv").style.display = 'block';
  } else {
    document.getElementById("FinalPromptDiv").style.display = 'none';
  }
}


function resetInputs() {
  document.getElementById("textInput").value = defaultValues.textToImport;
  document.getElementById("mainPrompt").value = defaultValues.mainPrompt;
  document.getElementById("messagePrepend").value = defaultValues.messagePrepend;
  document.getElementById("messageAppend").value = defaultValues.messageAppend;
  document.getElementById("finalPrompt").value = defaultValues.finalPrompt;
  updateTotalMessages();
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


function showTextInputPopup() {
  return new Promise((resolve, reject) => {
    const popup = document.createElement("div");
    popup.classList.add("confirmation-popup");

    const messageLabel = document.createElement("label");
    messageLabel.textContent = "Paste in a unique string that you want to resume from.";
    messageLabel.style.display = "block";
    messageLabel.style.margin = "10px";
    popup.appendChild(messageLabel);

    const messageInput = document.createElement("textarea");
    messageInput.style.width = "75%";
    messageInput.style.height = "100px";
    messageInput.style.resize = "none";
    messageInput.style.margin = "20px";
    popup.appendChild(messageInput);

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.id = "cancel-button";
    cancelButton.style.marginRight = "10px";
    cancelButton.addEventListener("click", () => {
      document.body.removeChild(popup);
    });
    popup.appendChild(cancelButton);

    const submitButton = document.createElement("button");
    submitButton.textContent = "Submit";
    submitButton.id = "submit-button";
    submitButton.addEventListener("click", (e) => {
      if (e.target.id === "submit-button") {
        resolve(messageInput.value);
      } else if (e.target.id === "cancel-button") {
        resolve(null);
      }
      const message = messageInput.value;
      popup.remove();
    });
    popup.appendChild(submitButton);
    document.body.appendChild(popup);

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




function reset() {
  resetInputs();
}

function stop(tabs) {
  browser.tabs.sendMessage(tabs[0].id, {
    command: "stop",
  }).catch(reportError);
}



/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
function listenForClicks() {
  document.addEventListener("click", (e) => {
    function resume(tabs, startingString) {
      // Get the value from the textInput element
      const textValue = document.getElementById("textInput").value;

      // Find the starting index of the startingString within textValue
      const startIndex = textValue.indexOf(startingString);

      // Check if the startingString is found within textValue
      if (startIndex === -1) {
        // Handle the case where startingString is not found
        console.error("Starting string not found in text input.");
        return; // Exit the function if startingString is not found
      }

      // Extract the substring from the starting index to the end of textValue
      const textToImport = textValue.substring(startIndex);

      // Send the message to the tab with the extracted text
      browser.tabs.sendMessage(tabs[0].id, {
        command: "resume",
        maxMessageLength: localStorage.getItem("defaultMaxMessageLength"),
        textToImport: textToImport, // Use the extracted substring
        messagePrepend: document.getElementById("messagePrepend").value,
        messageAppend: document.getElementById("messageAppend").value,
        useFinalPrompt: localStorage.getItem("defaultUseFinalPrompt"),
        finalPrompt: document.getElementById("finalPrompt").value,
        splitOnLineBreaks: localStorage.getItem("defaultSplitOnLineBreaks"),
      });
    }
    function run(tabs) {
      browser.tabs.sendMessage(tabs[0].id, {
        command: "run",
        maxMessageLength: localStorage.getItem("defaultMaxMessageLength"),
        textToImport: document.getElementById("textInput").value,
        mainPrompt: document.getElementById("mainPrompt").value,
        messagePrepend: document.getElementById("messagePrepend").value,
        messageAppend: document.getElementById("messageAppend").value,
        useFinalPrompt: localStorage.getItem("defaultUseFinalPrompt"),
        finalPrompt: document.getElementById("finalPrompt").value,
        splitOnLineBreaks: localStorage.getItem("defaultSplitOnLineBreaks"),
      });
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
      document.getElementById("defaultUseFinalPrompt").checked = defaultValues.useFinalPrompt === 'true';
      document.getElementById("defaultFinalPrompt").value = defaultValues.finalPrompt;
      document.getElementById("defaultSplitOnLineBreaks").checked = defaultValues.splitOnLineBreaks === 'true';
    }
    else if (e.target.id === "close-button") {
      settingsContent.classList.toggle("show");
    }
    else if (e.target.id === "file-button") {
      browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
        browser.tabs.sendMessage(tabs[0].id, {
          command: "file-pick",
        }).catch((error) => {
          showConfirmationPopupOkay("Error. Make sure you are on the right web page.");
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
      defaultValues.useFinalPrompt = document.getElementById("defaultUseFinalPrompt").checked.toString();
      defaultValues.finalPrompt = document.getElementById("defaultFinalPrompt").value;
      defaultValues.splitOnLineBreaks = document.getElementById("defaultSplitOnLineBreaks").checked.toString();
      localStorage.setItem('defaultMainPrompt', defaultValues.mainPrompt);
      localStorage.setItem('defaultMessagePrepend', defaultValues.messagePrepend);
      localStorage.setItem('defaultMessageAppend', defaultValues.messageAppend);
      localStorage.setItem('defaultMaxMessageLength', defaultValues.maxMessageLength);
      localStorage.setItem('defaultUseFinalPrompt', defaultValues.useFinalPrompt);
      localStorage.setItem('defaultFinalPrompt', defaultValues.finalPrompt);
      localStorage.setItem('defaultSplitOnLineBreaks', defaultValues.splitOnLineBreaks);
      updateFinalMessageDisplay();
    }
    else if (e.target.id === "hard-reset-button") {
      showConfirmationPopupYesNo("Are you sure you want to restore the original default values?").then((response) => {
        if (response === "yes") {
          getJsonConfig().then(() => {
            document.getElementById("defaultMainPrompt").value = defaultValues.mainPrompt;
            document.getElementById("defaultPrepend").value = defaultValues.messagePrepend;
            document.getElementById("defaultAppend").value = defaultValues.messageAppend;
            document.getElementById("defaultUseFinalPrompt").checked = defaultValues.useFinalPrompt === 'true';
            document.getElementById("defaultFinalPrompt").value = defaultValues.finalPrompt;
            document.getElementById("defaultMaxMessageLength").value = defaultValues.maxMessageLength;
            document.getElementById("defaultSplitOnLineBreaks").checked = defaultValues.splitOnLineBreaks === 'true';
            settingsContent.classList.toggle("show");
          }
          );
        }
      }).catch((err) => {
        console.error(err);
      });
    }
    else if (e.target.id === "reset-button") {
      reset();
    }
    else if (e.target.id === "stop-button") {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(stop)
        .catch(reportError);
    }
    else if (e.target.id === "start-button") {
      browser.tabs.query({ active: true, currentWindow: true })
        .then(run)
        .catch(reportError);
    } else if (e.target.id === "resume-button") {
      showTextInputPopup().then((response) => {
        if (response !== null) {
          browser.tabs.query({ active: true, currentWindow: true })
            .then((tabs) => { resume(tabs, response) })
            .catch(reportError);
        }
      });
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


//listener for when the textInput value changes
//document.getElementById("textInput").addEventListener("input", updateTotalMessages);


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
  try {
    // First inject the shared methods 
    // Then inject the content_script.js
    browser.tabs.executeScript(tabs[0].id, { file: "/contentScript.bundle.js" });
    browser.tabs.sendMessage(tabs[0].id, { command: "file-get" }).catch(reportError);
  }
  catch (error) {
    reportError(error);
  }
}


handleBrowserAction();

(async function () {
  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;
  url = window.location.href;
  let cancel = false;

var config;
var maxMessageLength;
var timeout_ms;


  async function getConfig(){
  // Load the JSON config file
  const response = await fetch(browser.runtime.getURL('config.json'));
  config = await response.json();

  // Replace the constants with the values from the config file
  maxMessageLength = config.maxMessageLength;
  timeout_ms = config.timeout;
}

getConfig();


  async function sendMessages(message) {
    subStrings = splitString(message.textToImport, maxMessageLength);
    for (var i = 0; i < subStrings.length; i++) {
      var element = subStrings[i];
      var stringToSend = message.messagePrepend + "\n\n" + element + "\n\n" + message.messageAppend;
      if (cancel) break;
      await timeout(timeout_ms);
      waitForRegenerateResponseButton(sendChatGPTMessage, stringToSend);
    }
    cancel = false;
  }

  function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function sendChatGPTMessage(messageText) {
    if (document.getElementsByTagName("textarea")[0] === undefined) return;
    document.body.getElementsByTagName("textarea")[0].value = messageText;
    document.body.getElementsByTagName("textarea")[0].dispatchEvent(enterKeyDownEvent);
    //sendMessageButtonClick();
  }

  function run(message) {
    if (url.match("https:\/\/chat.openai.com\/\?.*")) {
      sendChatGPTMessage(message.mainPrompt);
      waitForRegenerateResponseButton(sendMessages, message);
    } else {
      console.log("Wrong Url");
    }
  }

  function splitString(str, maxLength) {
    let words = str.split(/\s+/);
    let substrings = [];
    let currentString = "";

    for (let word of words) {
      if (currentString.length + word.length <= maxLength) {
        currentString += `${word} `;
      } else {
        substrings.push(currentString.trim());
        currentString = `${word} `;
      }
    }

    if (currentString.trim().length) {
      substrings.push(currentString.trim());
    }

    return substrings;
  }


  function waitForRegenerateResponseButton(callback, param1) {
    isReady = false;
    let buttons = document.querySelectorAll('button');
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].textContent === "Regenerate response") {
        isReady = true;
        break;
      }
    }
    if (cancel) {
      return;
    }
    else if (isReady) {
      callback(param1);
    } else {
      setTimeout(() => {
        waitForRegenerateResponseButton(callback, param1);
      }, timeout_ms);
    }
  }

  // Create a new KeyboardEvent object for the 'keydown' event
  const enterKeyDownEvent = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true,
    cancelable: true
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "run") {
      cancel = false;
      getConfig();
      run(message);
    } else if (message.command === "file-get") {
      if (localStorage.getItem("importFile-new") === "true") {
        const fileContent = localStorage.getItem("importFile");
        browser.runtime.sendMessage({ command: "file-get", content: fileContent });
        localStorage.setItem("importFile-new","false");
      } else{
        browser.runtime.sendMessage({ command: "file-get", content: ""});
      }
    } else if (message.command === "stop") {
      cancel = true;
    } else if (message.command === "file-pick") {
      const textAreaElement = document.querySelector("textarea");
      var filePicker = null;
      filePicker = document.createElement("input");
      filePicker.style = "display: none;";
      filePicker.id = "filepicker-input";
      filePicker.type = "file";
      filePicker.accept = ".txt";
      filePicker.onchange = e => {
        localStorage.setItem("importFile-new", "true");
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = readerEvent => {
          var content = readerEvent.target.result;
          localStorage.setItem("importFile", content);
        }
      }
      document.body.appendChild(filePicker);

      var buttonContainer = textAreaElement.parentNode.previousSibling.firstChild;
      var filePickerButton = document.createElement("button");
      filePickerButton.classList.add(...config.regenerateResponseButtonClassString.split(' '));
      const imageUrl = browser.runtime.getURL('/icons/Red32.png');
      filePickerButton.id = "File-Picker-Button";
      filePickerButton.style.backgroundImage = `url("${imageUrl}")`;
      filePickerButton.style.backgroundSize = "contain";
      filePickerButton.style.backgroundRepeat = "no-repeat";
      filePickerButton.style.backgroundPosition = "center";
      filePickerButton.style.backgroundColor = "transparent";
      filePickerButton.style.border = "none";
      filePickerButton.style.height = "32px";
      filePickerButton.style.width = "32px";
      filePickerButton.style.alignSelf = "center";

      if (buttonContainer.hasChildNodes()) {
        if (buttonContainer.firstChild.id !== "File-Picker-Button"){
          buttonContainer.insertBefore(filePickerButton, buttonContainer.firstChild);
        }
      } else {
        buttonContainer.appendChild(filePickerButton);
      }

      filePickerButton.onclick = () => {
        filePicker.click();
      }
    }
  });

})();

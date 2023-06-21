
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
  var checkReadyButtonTimeout_ms;
  var readyDelayTimeout_ms;
  var timeBetweenMessages_ms;


  async function getConfig(){
  // Load the JSON config file
  const response = await fetch(chrome.runtime.getURL('config.json'));
    config = await response.json();

    // Replace the constants with the values from the config file
    readyDelayTimeout_ms = config.readyDelayTimeout;
    checkReadyButtonTimeout_ms = config.checkReadyButtonTimeout;
    timeBetweenMessages_ms=config.timeBetweenMessages;
  }

  getConfig();

  async function sendMessages(message) {
    subStrings = splitString(message.textToImport, message.maxMessageLength);
    for (var i = 0; i < subStrings.length; i++) {
      var element = subStrings[i];
      var stringToSend = message.messagePrepend + "\n\n" + element + "\n\n" + message.messageAppend;
      if (cancel) break;
      await waitForRegenerateResponseButton(sendChatGPTMessage, stringToSend);
      await timeout(timeBetweenMessages_ms);
    }
    cancel = false;
  }

  function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function sendChatGPTMessage(messageText) {
    if (document.getElementsByTagName("textarea")[0] === undefined) {
      console.log("failure");
      return;
    }
    document.body.getElementsByTagName("textarea")[0].value = messageText;
    let event = new Event('input', {
      bubbles: true,
      cancelable: true,
    });
    document.body.getElementsByTagName("textarea")[0].dispatchEvent(event);
    document.body.getElementsByTagName("textarea")[0].dispatchEvent(enterKeyDownEvent);
  }

  async function run(message) {
    if (url.match("https:\/\/chat.openai.com\/\?.*")) {
      await sendChatGPTMessage(message.mainPrompt);
      await timeout(timeBetweenMessages_ms);
      await waitForRegenerateResponseButton(sendMessages, message);
      if(message.useFinalPrompt.toLowerCase() ==="true"){
        await timeout(timeBetweenMessages_ms);
        await waitForRegenerateResponseButton(sendChatGPTMessage,message.finalPrompt);
      }
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


async function waitForRegenerateResponseButton(callback, param1) {
  let isReady = false;
  while (!isReady && !cancel) {
    let buttons = document.querySelectorAll('button');
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].textContent === "Regenerate response") {
        isReady = true;
        break;
      }
    }

    if (isReady) {
      await timeout(readyDelayTimeout_ms);
      await callback(param1);
    } else {
      await timeout(checkReadyButtonTimeout_ms);
    }
  }
}

    // Create a new KeyboardEvent object for the 'keydown' event
    const enterKeyDownEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
      isTrusted: true,
    });

  chrome.runtime.onMessage.addListener((message) => {
    if (message.command === "run") {
      cancel = false;
      run(message);
    } else if (message.command === "file-get") {
      if (localStorage.getItem("importFile-new") === "true") {
        const fileContent = localStorage.getItem("importFile");
        chrome.runtime.sendMessage({ command: "file-get", content: fileContent });
        localStorage.setItem("importFile-new","false");
      } else{
        chrome.runtime.sendMessage({ command: "file-get", content: ""});
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
      var buttonContainer = textAreaElement.parentNode.previousSibling.firstChild;
      var filePickerButton = document.createElement("button");
      filePickerButton.classList.add(...config.regenerateResponseButtonClassString.split(' '));
      const imageUrl = chrome.runtime.getURL('/icons/Red32.png');
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
        document.body.appendChild(filePicker);

      if (buttonContainer.hasChildNodes()) {
        if (buttonContainer.firstChild.id !== "File-Picker-Button") {
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

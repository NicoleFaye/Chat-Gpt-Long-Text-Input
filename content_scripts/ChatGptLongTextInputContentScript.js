
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

  // Initialize Timing Variables
  let timesBetweenMessages = [];
  let previousTime = 0;

  var config;
  var checkReadyButtonTimeout_ms;
  var readyDelayTimeout_ms;
  var timeBetweenMessages_ms;
  var totalMessages = 0;
  var messagesSent = 0;

  getConfig();


  async function getConfig(){
  // Load the JSON config file
  const response = await fetch(chrome.runtime.getURL('config.json'));
    config = await response.json();

    // Replace the constants with the values from the config file
    readyDelayTimeout_ms = config.readyDelayTimeout;
    checkReadyButtonTimeout_ms = config.checkReadyButtonTimeout;
    timeBetweenMessages_ms = config.timeBetweenMessages;
  }

  async function sendMessages(message) {
    subStrings = splitString(message.textToImport, message.maxMessageLength);

    for (var i = 0; i < subStrings.length; i++) {
      var element = subStrings[i];
      var stringToSend = message.messagePrepend + "\n\n" + element + "\n\n" + message.messageAppend;



      if (cancel) break;
      await waitForRegenerateResponseButton(sendChatGPTMessage, stringToSend);
      await timeout(timeBetweenMessages_ms);

    }
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
    messagesSent++;
    // Current time in milliseconds
    let currentTime = new Date().getTime();

    // Calculate and store time between this and previous message
    if (previousTime !== 0) {
      timesBetweenMessages.push(currentTime - previousTime);

      // Calculate the Average Time Between Messages
      let averageTimeBetween = timesBetweenMessages.reduce((a, b) => a + b) / timesBetweenMessages.length;

      // Predict ETA
      let remainingMessages = totalMessages - messagesSent;
      let etaSeconds = (averageTimeBetween * remainingMessages) / 1000;
      let etaMinutes = Math.floor(etaSeconds / 60);
      etaSeconds = etaSeconds % 60;

      // Update the Display only if there are messages remaining
      if (totalMessages !== messagesSent) {
        document.getElementById("messages-remaining-display").textContent = `${messagesSent}/${totalMessages} ETA: ${etaMinutes}m ${Math.round(etaSeconds)}s`;
      } else {
        document.getElementById("messages-remaining-display").textContent = `${messagesSent}/${totalMessages}`;
      }
    } else {
      document.getElementById("messages-remaining-display").textContent = `${messagesSent}/${totalMessages} ETA: Calculating...`;
    }

    // Update previousTime
    previousTime = currentTime;

  }

  async function resume(message) {
    if (url.match("https:\/\/chat.openai.com\/\?.*")) {
      numberOfMessages = determineNumberOfMessages(message, true);
      totalMessages = numberOfMessages;
      messagesSent = 0;
      timesBetweenMessages = [];
      previousTime = 0;
      await waitForRegenerateResponseButton(sendMessages, message);
      if (message.useFinalPrompt.toLowerCase() === "true") {
        await timeout(timeBetweenMessages_ms);
        await waitForRegenerateResponseButton(sendChatGPTMessage, message.finalPrompt);
      }
    } else {
      console.log("Wrong Url");
    }

  }
  async function run(message) {
    if (url.match("https:\/\/chat.openai.com\/\?.*")) {
      numberOfMessages = determineNumberOfMessages(message);
      totalMessages = numberOfMessages;
      messagesSent = 0;
      timesBetweenMessages = [];
      previousTime = 0;
      await sendChatGPTMessage(message.mainPrompt);
      await timeout(timeBetweenMessages_ms);
      await waitForRegenerateResponseButton(sendMessages, message);
      if (message.useFinalPrompt.toLowerCase() === "true") {
        await timeout(timeBetweenMessages_ms);
        if (!cancel) {
          await waitForRegenerateResponseButton(sendChatGPTMessage, message.finalPrompt);
        }
      }
    } else {
      console.log("Wrong Url");
    }
  }

  function determineNumberOfMessages(message, resume = false) {
    let subStrings = splitString(message.textToImport, message.maxMessageLength);
    let numberOfMessages = subStrings.length;

    // Add one for the mainPrompt message
    if (!resume) {
      numberOfMessages++;
    }

    // Add one more if useFinalPrompt is set to true
    if (message.useFinalPrompt.toLowerCase() === "true") {
      numberOfMessages++;
    }

    return numberOfMessages;
  }

  function isElementVisible(el) {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);

    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom >= 0 &&
      rect.right >= 0 &&
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.left <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }


  async function waitForRegenerateResponseButton(callback, param1) {
    let isReady = false;
    while (!isReady && !cancel) {
      let buttons = document.querySelectorAll('button');
      for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].className.includes("p-1 gizmo:pl-0 rounded-md disabled:dark:hover:text-gray-400") &&
          isElementVisible(buttons[i]) &&
          document.querySelectorAll('button[aria-label="Stop generating"]').length<1
          ) {
            console.log("ready");
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
  // This extension script listens for messages sent from the extension or the webpage

    const textAreaElement = document.getElementById("prompt-textarea");
    var buttonContainer = textAreaElement.parentNode.parentNode;
    if (message.command === "run") {

      // Create a span element to display the number of messages remaining
      var messagesRemainingDisplay = document.createElement("span");
      messagesRemainingDisplay.id = "messages-remaining-display";
      messagesRemainingDisplay.textContent = "";  // Initially empty
      messagesRemainingDisplay.style.display = "flex";
      messagesRemainingDisplay.style.alignItems = "center";
      messagesRemainingDisplay.style.marginInline = "10px";  // Add some space between the button and the text


      if (buttonContainer.hasChildNodes()) {
        //loop through the children of the button container to make sure none have the id of messages-remaining-display
        for (let i = 0; i < buttonContainer.childNodes.length; i++) {
          if (buttonContainer.childNodes[i].id === "messages-remaining-display") {
            buttonContainer.removeChild(buttonContainer.childNodes[i]);
          }
        }

        if (buttonContainer.firstChild.id !== "File-Picker-Button" && buttonContainer.firstChild.id !== "messages-remaining-display") {
          buttonContainer.insertBefore(messagesRemainingDisplay, buttonContainer.firstChild);
        } else if (buttonContainer.firstChild.id === "File-Picker-Button") {
          buttonContainer.insertBefore(messagesRemainingDisplay, buttonContainer.firstChild.nextSibling);
        }
      } else {
        buttonContainer.appendChild(messagesRemainingDisplay);
      }

      cancel = false;
      run(message);

    } else if (message.command === "resume") {

      // Create a span element to display the number of messages remaining
      var messagesRemainingDisplay = document.createElement("span");
      messagesRemainingDisplay.id = "messages-remaining-display";
      messagesRemainingDisplay.textContent = "";  // Initially empty
      messagesRemainingDisplay.style.display = "flex";
      messagesRemainingDisplay.style.alignItems = "center";
      messagesRemainingDisplay.style.marginLeft = "10px";  // Add some space between the button and the text


      if (buttonContainer.hasChildNodes()) {
        if (buttonContainer.firstChild.id !== "File-Picker-Button" && buttonContainer.firstChild.id !== "messages-remaining-display") {
          buttonContainer.insertBefore(messagesRemainingDisplay, buttonContainer.firstChild);
        } else if (buttonContainer.firstChild.id === "File-Picker-Button") {
          buttonContainer.insertBefore(messagesRemainingDisplay, buttonContainer.firstChild.nextSibling);
        }
      } else {
        buttonContainer.appendChild(messagesRemainingDisplay);
      }

      cancel = false;
      resume(message);
    } else if (message.command === "file-get") {
      // If the command is 'file-get', it fetches and sends back the contents of a previously stored file

      // Fetch and send file content if new, or send back empty content
      if (localStorage.getItem("importFile-new") === "true") {
        const fileContent = localStorage.getItem("importFile");
        chrome.runtime.sendMessage({ command: "file-get", content: fileContent });
        localStorage.setItem("importFile-new","false");
      } else{
        chrome.runtime.sendMessage({ command: "file-get", content: ""});
      }

      // If the command is 'stop', it sets a cancellation flag
    } else if (message.command === "stop") {
      cancel = true;

      // If the command is 'file-pick', it adds a file picker button to the webpage, which, when clicked, will open a file dialog.
      // The selected file's content is read and stored for future use 
    } else if (message.command === "file-pick") {
      const textAreaElement = document.querySelector("textarea");
      var filePicker = null;
      filePicker = document.createElement("input");
      filePicker.style = "display: none;";
      filePicker.id = "filepicker-input";
      filePicker.type = "file";
      filePicker.accept = ".txt";

      // File selection and reading logic
      filePicker.onchange = e => {
        localStorage.setItem("importFile-new", "true");
        var file = e.target.files[0];
        var reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = readerEvent => {
          // Store the content of the selected file for later use
          var content = readerEvent.target.result;
          localStorage.setItem("importFile", content);
        }
      }
      // Append the file input element to the document body
      document.body.appendChild(filePicker);


      // Create and style a button that will trigger the hidden file input when clicked
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
      filePickerButton.style.marginInline = "10px";

      if (buttonContainer.hasChildNodes()) {
        if (buttonContainer.firstChild.id !== "File-Picker-Button") {
          buttonContainer.insertBefore(filePickerButton, buttonContainer.firstChild);
        }
      } else {
        buttonContainer.appendChild(filePickerButton);
      }

      // When the button is clicked, trigger the hidden file picker
      filePickerButton.onclick = () => {
        filePicker.click();
      }
    }
  });

})();

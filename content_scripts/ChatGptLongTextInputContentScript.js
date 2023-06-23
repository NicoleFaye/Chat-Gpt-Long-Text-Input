
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

  getConfig();


  async function getConfig() {
    // Load the JSON config file
    const response = await fetch(browser.runtime.getURL('config.json'));
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
      if (message.useFinalPrompt.toLowerCase() === "true") {
        await timeout(timeBetweenMessages_ms);
        await waitForRegenerateResponseButton(sendChatGPTMessage, message.finalPrompt);
      }
    } else {
      console.log("Wrong Url");
    }
  }

  /**
   * Function to split a given string into substrings of a specified maximum length.
   * This function will not split words, it will keep words intact while splitting.
   * 
   * @param {string} str - The string to be split.
   * @param {number} maxLength - The maximum length of each substring.
   * @returns {string[]} An array of substrings.
   */
  function splitString(str, maxLength ) {
    let regex =  /\s+/;

    // Split the input string into words by the chosen regex.
    let words = str.split(regex);

    // Initialize an array to hold the substrings that we will return.
    let substrings = [];

    // Initialize a string to accumulate words until we reach the maxLength.
    let currentString = "";

    // Loop over each word in the words array.
    for (let word of words) {
      // Check if the current word can fit into the currentString without exceeding the maxLength.
      if (currentString.length + word.length <= maxLength) {
        // If it fits, add the word to the currentString with a trailing space.
        currentString += `${word} `;
      } else {
        // If it doesn't fit, push the currentString into the substrings array after trimming any trailing spaces.
        substrings.push(currentString.trim());

        // Start a new currentString with the current word.
        currentString = `${word} `;
      }
    }

    // After the loop, there may be a leftover currentString that hasn't been added to the substrings array.
    // If this string is not empty (after trimming), add it to the substrings array.
    if (currentString.trim().length) {
      substrings.push(currentString.trim());
    }

    // Return the array of substrings.
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

  // This extension script listens for messages sent from the extension or the webpage
  browser.runtime.onMessage.addListener((message) => {

    // If the command is 'run', it resets a cancellation flag and runs a certain function
    if (message.command === "run") {
      cancel = false;
      run(message);

    // If the command is 'file-get', it fetches and sends back the contents of a previously stored file
    } else if (message.command === "file-get") {

      // Fetch and send file content if new, or send back empty content
      if (localStorage.getItem("importFile-new") === "true") {
        const fileContent = localStorage.getItem("importFile");
        browser.runtime.sendMessage({ command: "file-get", content: fileContent });
        localStorage.setItem("importFile-new", "false");
      } else {
        browser.runtime.sendMessage({ command: "file-get", content: "" });
      }

    // If the command is 'stop', it sets a cancellation flag
    } else if (message.command === "stop") {
      cancel = true;

    // If the command is 'file-pick', it adds a file picker button to the webpage, which, when clicked, will open a file dialog.
    // The selected file's content is read and stored for future use 
    } else if (message.command === "file-pick") {

      // Select the textarea element from the document
      const textAreaElement = document.getElementById("prompt-textarea");

      // Create a hidden file input element for file selection and reading
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
      
      // The button is added to the button container element in the webpage
      var buttonContainer = textAreaElement.parentNode.previousSibling.firstChild;

      // Create and style a button that will trigger the hidden file input when clicked
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

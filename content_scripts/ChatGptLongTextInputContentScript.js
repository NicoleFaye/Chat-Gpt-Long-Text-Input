
(function () {
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
  let cancel=false;

  const stopGeneratingButtonClassString = "btn flex justify-center gap-2 btn-neutral border-0";
  const sendMessageButtonClassString = "absolute p-1 rounded-md text-gray-500 bottom-1.5 right-1";

  async function sendMessages(message) {
    subStrings = splitString(message.textToImport,2000);
    for (var i = 0; i < subStrings.length; i++) {
      var element = subStrings[i];
      var stringToSend = message.secondMessage + "\n\n" + element;
      if(cancel)break;
      await waitForRegenerateResponseButton(sendChatGPTMessage, stringToSend);
    }
    cancel=false;
  }


  function sendChatGPTMessage(messageText){
      if(document.getElementsByTagName("textarea")[0]===undefined)return;
      document.body.getElementsByTagName("textarea")[0].value = messageText;
      document.body.getElementsByTagName("textarea")[0].dispatchEvent(enterKeyDownEvent);
      //sendMessageButtonClick();
  }

  function run(message) {
    if (url.match("https:\/\/chat.openai.com\/chat\S*")) {
      sendChatGPTMessage(message.firstMessage);
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
    if(cancel){
      return;
    }
    else if (isReady) {
      callback(param1);
    } else {
      setTimeout(() => {
        waitForRegenerateResponseButton(callback, param1);
      }, 100);
    }
  }


  browser.runtime.onMessage.addListener((message) => {
    if (message.command === "run") {
      cancel=false;
      run(message);
    }else if(message.command==="stop"){
      cancel=true;
    }
  });

})();



// Create a new KeyboardEvent object for the 'keydown' event
const enterKeyDownEvent = new KeyboardEvent('keydown', {
  key: 'Enter',
  code: 'Enter',
  keyCode: 13,
  which: 13,
  bubbles: true,
  cancelable: true
});

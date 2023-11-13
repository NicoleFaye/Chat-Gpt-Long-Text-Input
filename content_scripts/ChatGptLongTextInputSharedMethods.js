import { getEncoding } from "js-tiktoken";
/**
 * Function to split a given string into substrings of a specified maximum token length.
 * 
 * @param {string} str - The string to be split.
 * @param {number} maxTokenLength - The maximum length of each substring in tokens.
 * @param {boolean} splitOnLineBreaks - If true, splits by lines; otherwise, splits by words.
 * @returns {string[]} An array of substrings.
 */
function splitString(str, maxTokenLength, splitOnLineBreaks = false) {
  // Get the encoding for a specific model
  const encoding = getEncoding("cl100k_base");

  let regex = splitOnLineBreaks ? /(\r\n|\r|\n)/ : /(?<=\S)(?=\s|$)/;
  let splitItems = str.split(regex);
  let substrings = [];
  let currentString = "";

  for (let item of splitItems) {
    let tempString = currentString + item;
    let tokenCount = encoding.encode(tempString).length;
    if (tokenCount <= maxTokenLength) {
      currentString = tempString;
    } else {
      if (currentString.length > 0) {
        substrings.push(currentString);
        currentString = item;
      }
    }
  }

  if (currentString.length) {
    substrings.push(currentString);
  }

  return substrings;
}

export default splitString;

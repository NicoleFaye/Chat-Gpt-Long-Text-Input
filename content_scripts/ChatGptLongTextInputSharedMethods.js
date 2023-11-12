import { Tiktoken } from "tiktoken/lite";
import cl100k_base from "tiktoken/encoders/cl100k_base.json";
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
  const encoding = new Tiktoken(
  cl100k_base.bpe_ranks,
  cl100k_base.special_tokens,
  cl100k_base.pat_str
);

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

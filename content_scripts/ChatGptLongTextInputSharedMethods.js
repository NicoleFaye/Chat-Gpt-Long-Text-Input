const TikToken = require('js-tiktoken');
/**
 * Function to split a given string into substrings of a specified maximum length.
 * This function can split by words or by lines, ensuring that words or lines are kept intact.
 * 
 * @param {string} str - The string to be split.
 * @param {number} maxLength - The maximum length of each substring.
 * @param {boolean} splitOnLineBreaks - If true, splits by lines; otherwise, splits by words.
 * @returns {string[]} An array of substrings.
 */
function splitString(str, maxLength, splitOnLineBreaks = false) {
  // Choose the splitting pattern based on splitOnLineBreaks.
  let regex = splitOnLineBreaks ? /(\r\n|\r|\n)/ : /(?<=\S)(?=\s|$)/;

  // Split the input string into words or lines.
  let splitItems = str.split(regex);

  // Initialize an array to hold the substrings that we will return.
  let substrings = [];

  // Initialize a string to accumulate words or lines until we reach the maxLength.
  let currentString = "";

  // Loop over each word or line in the splitItems array.
  for (let item of splitItems) {
    // Add the item length + potential space or newline.
    let additionalLength = splitOnLineBreaks ? item.length : (item.length + (currentString.length > 0 ? 1 : 0));

    if (currentString.length + additionalLength <= maxLength) {
      // Append the item with a space or keep the line break.
      currentString += (splitOnLineBreaks || currentString.length === 0 ? "" : " ") + item;
    } else {
      // If it doesn't fit, push the currentString into the substrings array and start new.
      if (currentString.length > 0) {
        substrings.push(currentString);
      }
      currentString = item;
    }
  }

  // After the loop, push the last currentString if it is not empty.
  if (currentString.length) {
    substrings.push(currentString);
  }

  // Return the array of substrings.
  return substrings;
}

export default splitString;
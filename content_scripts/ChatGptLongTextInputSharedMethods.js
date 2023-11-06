
  /**
   * Function to split a given string into substrings of a specified maximum length.
   * This function will not split words, it will keep words intact while splitting.
   * 
   * @param {string} str - The string to be split.
   * @param {number} maxLength - The maximum length of each substring.
   * @returns {string[]} An array of substrings.
   */
function splitString(str, maxLength) {
  let regex = /(?<=\S)(?=\s|$)/;

  // Split the input string into words by the chosen regex while keeping the trailing spaces.
  let words = str.split(regex);

  // Initialize an array to hold the substrings that we will return.
  let substrings = [];

  // Initialize a string to accumulate words until we reach the maxLength.
  let currentString = "";

  // Loop over each word in the words array.
  for (let word of words) {
    // Here we add 1 for the space that would be between the words in the substring
    if (currentString.length + word.length + (currentString.length > 0 ? 1 : 0) <= maxLength) {
      // Add a space if currentString is not empty and append the word.
      currentString += (currentString.length > 0 ? " " : "") + word;
    } else {
      // If it doesn't fit, push the currentString into the substrings array.
      if (currentString.length > 0) {
        substrings.push(currentString);
      }
      // Start a new currentString with the current word.
      currentString = word;
    }
  }

  // After the loop, push the last currentString if it is not empty.
  if (currentString.length) {
    substrings.push(currentString);
  }

  // Return the array of substrings.
  return substrings;
}


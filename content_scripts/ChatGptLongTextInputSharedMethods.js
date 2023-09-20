
  /**
   * Function to split a given string into substrings of a specified maximum length.
   * This function will not split words, it will keep words intact while splitting.
   * 
   * @param {string} str - The string to be split.
   * @param {number} maxLength - The maximum length of each substring.
   * @returns {string[]} An array of substrings.
   */
  function splitString(str, maxLength) {
    let regex = /\s+/;

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


const path = require('path');

module.exports = {
  entry: './popup/ChatGptLongTextInput.js', // Replace with the path to your main script
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};

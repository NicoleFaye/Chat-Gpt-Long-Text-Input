const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: {
        popup: './popup/ChatGptLongTextInput.js',
        contentScript: './content_scripts/ChatGptLongTextInputContentScript.js',
        sharedMethods: './content_scripts/ChatGptLongTextInputSharedMethods.js',
    },

    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.json$/,
                loader: 'file-loader',
                type: 'javascript/auto',
                options: {
                    name: '[name].[ext]',
                },
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'popup/ChatGptLongTextInput.html', to: 'popup/index.html' },
                { from: 'popup/ChatGptLongTextInput.css', to: 'popup/style.css' },
                { from: 'config.json', to: 'config.json' },
                { from: 'icons', to: 'icons' },
                { from: 'manifest.json', to: 'manifest.json'}
            ],
        }),
    ],
};

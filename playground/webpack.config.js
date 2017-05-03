const webpack = require('webpack')
const path = require('path')

module.exports = {
  entry: ['babel-polyfill', './playground.js'],

  target: 'web',

  output: {
    path: __dirname,
    filename: 'bundle.js',
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['babel-preset-latest'].map(require.resolve)
        }
      },
      {
        test: /\.json$/,
        exclude: /node_modules/,
        loader: 'json-loader'
      }
    ]
  },
}
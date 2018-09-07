const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: {
    pdfjs: './lib/index.js'
  },

  resolve: {
    // extensions: ['.ts', '.tsx', '.js', '.jsx'],

    // modules: [
    //   path.resolve(__dirname, '../node_modules'),
    //   path.resolve(__dirname, `../${target}/js`),
    //   path.resolve(__dirname, `../shared/js`),
    //   path.resolve(__dirname, `../client/js`),
    //   path.resolve(__dirname, `../admin/js`)
    // ],

    // alias: {
    //   shared: path.resolve(__dirname, '../shared/js/'),
    //   webpack: path.resolve(__dirname, '../webpack/')
    // }
  },


  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },

  mode: 'development',

  module: {
    rules: [
      {
        test: '/.*/',
        sideEffects: false
      }
    ]
  },

  // stream: {
  //   stream: 'stream'
  // }

  // optimization: {
  //   // disable global minification, sicne minimification is done using a loader
  //   minimize: false,
  //   splitChunks: {
  //     chunks: 'all',
  //     maxInitialRequests: 2
  //   }
  // },

  plugins: [
    // merge chunks that are smaller than minChunkSize (number of characters)
    // new webpack.optimize.MinChunkSizePlugin({
    //   minChunkSize: 1024 * 100 // 100 kB
    // }),
    new webpack.IgnorePlugin(/^stream$/)
  ]
}

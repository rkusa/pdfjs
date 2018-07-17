const path = require('path');

module.exports = {
  entry: [    'babel-regenerator-runtime',
  './lib/index.js'],
  output: {
    library: 'pdfjs',
    libraryTarget: 'umd',
    filename: 'pdfjs.js',
    auxiliaryComment: 'PDF merge lib',
    path: path.resolve(__dirname, './dist')
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    alias: {
      'opentype.js': path.resolve(__dirname, 'opentype.js')
    }
  }
};
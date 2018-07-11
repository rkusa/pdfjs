import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'

export default {
  input: 'lib/node.js',
  output: [
    {
      file: 'dist/pdfjs.cjs.js',
      format: 'cjs'
    },
    // {
    //   file: 'dist/pdfjs.es.js',
    //   format: 'umd',
    //   name: 'pdfjs'
    // },
  ],
  plugins: [
    resolve({
      browser: true
    //   customResolveOptions: {
    //   moduleDirectory: 'node_modules'
    // }
   }),
    commonjs(),
    json()
  ],
  external: ['stream']
}
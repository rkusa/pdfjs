const esbuild = require('esbuild')

const COMMON_OPTS = {
  bundle: true,
  minify: true,
  target: ['chrome58', 'firefox57', 'safari11', 'edge18']
}

esbuild.buildSync({
  ...COMMON_OPTS,
  entryPoints: ['playground.js'],
  outfile: 'public/bundle.js',
  define: {
    'global': 'window'
  },
  inject: ['./inject.js'],
  loader: {
    '.ttf': 'file'
  },
})

const WORKERS = {
  'json.worker.js': 'language/json/json.worker.js',
  'css.worker.js': 'language/css/css.worker.js',
  'html.worker.js': 'language/html/html.worker.js',
  'ts.worker.js': 'language/typescript/ts.worker.js',
  'editor.worker.js': 'editor/editor.worker.js',
}

for (const [to, from] of Object.entries(WORKERS)) {
  esbuild.buildSync({
    ...COMMON_OPTS,
    entryPoints: [`./node_modules/monaco-editor/esm/vs/${from}`],
    outfile: `public/${to}`,
  })
}


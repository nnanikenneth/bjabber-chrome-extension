const webpack = require('webpack');
const path = require('path');
// const remToPx = require('rem-to-px');

const HardSourcePlugin = require('hard-source-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const env = process.env.NODE_ENV;
const variant = process.env.VARIANT || 'pilot';
const manifest = variant === 'prod' ? 'manifest-prod.json' : 'manifest.json';

function remToPx(css) {
  const regex = /(\-?[0-9]*\.?[0-9]+)rem/g;
  const fontSize = 12;
  let res = '';
  let startIdx = 0;
  let match;
  while ((match = regex.exec(css)) != null) {
    const idx = match.index;
    const value = match[1];
    const pxValue = parseFloat(value) * fontSize;
    res = res + css.substring(startIdx, idx) + pxValue + 'px';
    startIdx = idx + match[0].length;
  }
  res = res + css.substring(startIdx);
  return res;
}

const plugins = [
  new webpack.optimize.CommonsChunkPlugin({
    name: 'commons',
    filename: 'commons.js',
  }),
  new CopyPlugin([
    { from: manifest, to: 'manifest.json' },
    { from: 'popup/src/index.html', to: 'popup.html' },
    { from: 'background/src/index.html', to: 'background.html' },
    { from: 'background/src/vendor/ciscobase.js', to: 'ciscobase.js' },
    { from: 'background/src/vendor/cwic.js', to: 'cwic.js' },
    { from: '*.png', to: 'icons/', context: 'shared/icons/' },
    { from: 'shared/styles/fonts.css', to: 'styles/fonts.css' },
    { from: '**/*', to: 'styles/fonts/', context: 'shared/styles/fonts/' },
    { from: '**/*', to: 'styles/themes/', context: 'shared/styles/themes/' },
    { 
      from: 'shared/styles/semantic.min.css',
      to: 'styles/semantic.min.css',
      transform: (content) => {
        let str = content;
        if (Buffer.isBuffer(content)) {
          str = content.toString('utf8');
        }
        const transformed = remToPx(str);
        return Buffer.from(transformed, 'utf8');
      },
      cache: true,
    },
  ]),
  new HardSourcePlugin(),
];

let devtool = 'source-map';

if (env === 'production') {
  plugins.push(
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      cache: true,
      parallel: true,
      ecma: 6,
    })
  );

  devtool = false;
}

const config = {
  cache: true,
  devtool: devtool,
  
  entry: {
    background: './background/src/index.js',
    popup: './popup/src/index.js',
    content: './content/src/index.js',
  },

  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'build'),
    publicPath: '/',
  },

  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    modules: ['node_modules'],
  },

  plugins: plugins,

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /(node_modules)/,
        options: {
          cacheDirectory: './.webpack_cache/',
          presets: ['es2015', 'react', 'stage-2']
        }
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /(node_modules)/,
      }
    ]
  },
};

module.exports = config;

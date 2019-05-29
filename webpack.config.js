var path = require("path");
var fs = require('fs-extra');
var webpack = require("webpack");
var Clean = require("clean-webpack-plugin");
var BuildPaths = require("./lib/build-paths");
var BuildExtension = require("./lib/build-extension-webpack-plugin");
var MiniCssExtractPlugin = require("mini-css-extract-plugin");

var manifest = fs.readJSONSync(path.join(BuildPaths.SRC_ROOT, 'manifest.json'));
var version = manifest.version;

var entries = {
  viewer: ["./extension/src/viewer.js"],
  "viewer-alert": ["./extension/styles/viewer-alert.scss"],
  options: ["./extension/src/options.js"],
  backend: ["./extension/src/backend.js"],
  omnibox: ["./extension/src/omnibox.js"],
  "omnibox-page": ["./extension/src/omnibox-page.js"]
};

function findThemes(darkness) {
  return fs.readdirSync(path.join('extension', 'themes', darkness)).
    filter(function(filename) {
      return /\.js$/.test(filename);
    }).
    map(function(theme) {
      return theme.replace(/\.js$/, '');
    });
}

function includeThemes(darkness, list) {
  list.forEach(function(filename) {
    entries[filename] = ["./extension/themes/" + darkness + "/" + filename + ".js"];
  });
}

var lightThemes = findThemes('light');
var darkThemes = findThemes('dark');
var themes = {light: lightThemes, dark: darkThemes};

includeThemes('light', lightThemes);
includeThemes('dark', darkThemes);

console.log("Entries list:");
console.log(entries);
console.log("\n");

var manifest = {
  context: __dirname,
  entry: entries,
  devtool: 'inline-cheap-source-map',
  output: {
    path: path.join(__dirname, "build/json_viewer/assets"),
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          'style-loader',
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.css', '.scss'],
    modules: [
      path.resolve(__dirname, './extension'),
      "node_modules"
    ]
  },
  externals: [
    {
      "chrome-framework": "chrome"
    }
  ],
  plugins: [
    new Clean({
      cleanOnceBeforeBuildPatterns: [path.join(process.cwd(), 'build/**/*')]
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css"
    }),
    new webpack.DefinePlugin({
      "process.env": {
        VERSION: JSON.stringify(version),
        THEMES: JSON.stringify(themes)
      }
    }),
    new BuildExtension({
      themes: themes
    })
  ]
};

module.exports = manifest;

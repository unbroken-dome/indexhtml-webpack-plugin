# Index HTML plugin for webpack

## Motivation

One of the "entry points" to a web application is typically the index.html file, but entry points in webpack can
only produce Javascript assets. With this plugin it is possible to produce a .html asset instead.

## Features

* Allows an entry point for a .html file to produce an .html asset
* Replaces references to Javascript entry points (`<script src="...">`) with the references to the bundled assets

## Installation

    npm install --save-dev indexhtml-webpack-plugin

## Usage

Declare your index.html as an entry point in your `webpack.config.js` file:

```javascript
module.exports = {

    entry: {
        'index.html': './index.html'
    }
    
    // ...
}
```

Add the [html loader](https://github.com/webpack/html-loader) for index.html. 

```javascript
module.exports = {
    // ...

    module: {
        loaders: [
            {
                test: /index\.html$/,
                loader: 'html'
            },
            
            // If you have any other loaders that match HTML files, make sure to exclude index.html from their pattern
            {
                test: /\.html$/,
                exclude: /index\.html$/,
                loader: /* ... */
            }
        ]
    }
    
    // ...
}
```

Add the `IndexHtmlPlugin`. It takes the names of the source file and target file as parameters.

```javascript
var IndexHtmlPlugin = require('indexhtml-webpack-plugin');

module.exports = {
    // ...
    
    plugins: [
        new IndexHtmlPlugin()
    ]
    
    // ...
}
```

### Using with CSS

You can use the HTML loader to detect links to external resources (like stylesheets), so they will become dependencies
of the "index.html" module. Use the [extract-text-webpack-plugin](https://github.com/webpack/extract-text-webpack-plugin)
to extract these stylesheets into separate files.

If you have multiple &lt;link&gt; tags that reference external stylesheet, these stylesheets might actually end up in the
same bundled asset. The plugin will automatically coalesce all `<link>` tags with the same `rel` and `href` attributes
into one.

Example webpack.config.js:

```javascript
var ExtractTextPlugin = require('extract-text-webpack-plugin'),
    IndexHtmlPlugin = require('indexhtml-webpack-plugin');
    
var cssExtractPlugin = new ExtractTextPlugin('styles/[contenthash:16].css');

module.exports = {
    context: path.resolve(__dirname, 'src'),
    
    entry: {
        'index.html': './index.html',
        app: './app.js'
    }
    
    module: {
        loaders: [
            {
                test: /index\.html$/,
                loader: 'html?attrs=link:href'
            },
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'jshint'
            },
            {
                test: /\.css$/,
                loader: cssExtractPlugin.extract('style', 'css')
            }
        ]
    },
    
    plugins: [
        cssExtractPlugin,
        new IndexHtmlPlugin()
    ]
};
```

### Options

IndexHtmlPlugin takes an optional `options` object as a parameter to override
the files it processes.

#### test
The `test` property on the `options` is a RegExp that the source file must
match for IndexHtmlPlugin to process it.  Defaults to `/\.html$/`.

#### exclude
The `exclude` property on the `options` is a RegExp that the source file must
*not* match for IndexHtmlPlugin to process it. If `undefined`, no files
that match `test` will be excluded. Defaults to `undefined`.

#### Example:

```
new IndexHtmlPlugin({
  test: /\.html?$/,    // handle .htm and .html files
  exclude: /^other\.html$/, // exclude other.html
})
```

## License

MIT (http://www.opensource.org/licenses/mit-license.php)

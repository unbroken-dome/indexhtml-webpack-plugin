var path = require('path');
var cheerio = require('cheerio');
var URI = require('URIjs');
var Source = require('webpack/lib/Source');

/**
 * @class
 * @extends Source
 * @param {Module} sourceModule
 * @param {Chunk} sourceChunk
 * @param {Compilation} compilation
 */
function IndexHtmlSource(sourceModule, sourceChunk, compilation) {
    this.sourceModule = sourceModule;
    this.sourceChunk = sourceChunk;
    this.compilation = compilation;
}
module.exports = IndexHtmlSource;

IndexHtmlSource.prototype = Object.create(Source.prototype);
IndexHtmlSource.prototype.constructor = IndexHtmlSource;

IndexHtmlSource.prototype.source = function() {
    var html = this._getHtmlFromModule();
    var $ = cheerio.load(html);
    coalesceLinks($);
    this._resolveScripts($);
    return $.html();
};

/**
 * Extracts the HTML code from the module source
 */
IndexHtmlSource.prototype._getHtmlFromModule = function() {
    var code = this.sourceModule.source().source()
        .replace(/^module\.exports\s*=\s*/, '');

    //noinspection JSUnusedLocalSymbols
    var __webpack_require__ = function (moduleId) {
        var module = find(this.sourceChunk.modules, function (module) {
            return module.id === moduleId
        });
        return find(module.chunks[0].files, function (file) {
            return file.match(/\.css$/)
        });
    }.bind(this);

    return eval(code);
};


/**
 * Resolve <script> tags that refer to entry points by replacing them with the final names of the bundles.
 * @param $
 */
IndexHtmlSource.prototype._resolveScripts = function($) {

    var compilation = this.compilation;
    var sourceContext = this.sourceModule.context;

    $('script').each(function () {
        var scriptSrc = $(this).attr('src');
        if (scriptSrc) {
            var scriptSrcUri = new URI(scriptSrc);
            if (!scriptSrcUri.is('absolute')) {

                var entry = path.resolve(sourceContext, scriptSrc);
                var moduleForEntry = find(compilation.modules, function (module) {
                    return path.normalize(module.resource) === entry
                });
                if (moduleForEntry) {
                    var chunkForEntry = moduleForEntry.chunks[0];
                    var chunkJsFile = find(chunkForEntry.files, function (file) {
                        return new URI(file).filename().match(/\.js$/)
                    });
                    if (chunkJsFile) {
                        $(this).attr('src', chunkJsFile);
                    }
                }
            }
        }
    });
};


function find(array, predicate) {
    if (array) {
        for (var i = 0; i < array.length; i++) {
            var item = array[i];
            if (predicate(item)) {
                return item;
            }
        }
    }
    return undefined;
}


/**
 * Coalesce all links with the same rel and href into one
 * @param $
 */
function coalesceLinks($) {
    $('link').each(function () {
        var rel = $(this).attr('rel');
        var href = $(this).attr('href');
        $(this).nextAll("link[rel='" + rel + "'][href='" + href + "']").remove();
    });
}

var path = require('path'),
    cheerio = require('cheerio'),
    URI = require('URIjs');
var RawSource = require('webpack/lib/RawSource');

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


function IndexHtmlPlugin(source, target) {

    /**
     * Extracts the HTML code from the module source
     * @param {Module} sourceModule
     * @param {Chunk} sourceChunk
     */
    function getHtmlFromModule(sourceModule, sourceChunk) {
        var code = sourceModule.source().source();
        code = code.replace(/^module\.exports\s*=\s*/, '');

        //noinspection JSUnusedLocalSymbols
        var __webpack_require__ = function (moduleId) {
            var module = find(sourceChunk.modules, function (module) {
                return module.id === moduleId
            });
            return find(module.chunks[0].files, function (file) {
                return file.match(/\.css$/)
            });
        };

        return eval(code);
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

    /**
     * Resolve <script> tags that refer to entry points by replacing them with the final names of the bundles.
     * @this Compilation
     * @param $
     * @param {string} sourceContext
     */
    function resolveScripts($, sourceContext) {
        $('script').each(function () {
            var scriptSrc = $(this).attr('src');
            if (scriptSrc) {
                var scriptSrcUri = new URI(scriptSrc);
                if (!scriptSrcUri.is('absolute')) {

                    var entry = path.resolve(sourceContext, scriptSrc);
                    var moduleForEntry = find(this.modules, function (module) {
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
    }

    /**
     * @param {Compiler} compiler
     */
    this.apply = function apply(compiler) {

        compiler.plugin('this-compilation', function (compilation) {

            /**
             * @this Compilation
             */
            function additionalChunkAssets() {

                var sourceChunk = this.namedChunks[source];
                var sourceModule = sourceChunk.origins[0].module;

                var html = getHtmlFromModule(sourceModule, sourceChunk);

                var $ = cheerio.load(html);
                coalesceLinks($);
                resolveScripts($, sourceModule.context);

                var filePath = this.getPath(target, {chunk: sourceChunk});
                this.additionalChunkAssets.push(filePath);
                this.assets[filePath] = new RawSource($.html());
                sourceChunk.files.push(filePath);
            }

            compilation.plugin('additional-chunk-assets', additionalChunkAssets);
        });

        /**
         * @param {Compilation} compilation
         * @param {function} callback
         */
        function emit(compilation, callback) {

            Object.keys(compilation.assets).forEach(function (file) {

                var targetFile = file;
                var queryStringIdx = targetFile.indexOf('?');
                if (queryStringIdx >= 0) {
                    targetFile = targetFile.substr(0, queryStringIdx);
                }

                if (targetFile === source + '.js' || targetFile === source + '.js.map') {
                    delete compilation.assets[file];
                }
            });

            callback();
        }
        compiler.plugin('emit', emit);
    };
}


module.exports = IndexHtmlPlugin;
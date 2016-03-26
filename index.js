var IndexHtmlSource = require('./IndexHtmlSource');

function IndexHtmlPlugin(options) {
    options = options || {};

    if (!options.test) {
      options.test = /\.html$/;
    }

    var matches = function(source) {
        if (!options.test.test(source)) {
            return false;
        }

        if (options.exclude && options.exclude.test(source)) {
            return false;
        }

        return true;
    };

    this.apply = function apply(compiler) {

        compiler.plugin('this-compilation', function (compilation) {

            compilation.plugin('additional-chunk-assets', function additionalChunkAssets() {

                Object.keys(this.namedChunks).forEach(function (source) {
                    if (matches(source)) {
                        var sourceChunk = this.namedChunks[source];
                        var sourceModule = sourceChunk.origins[0].module;

                        var filePath = this.getPath(source, { chunk: sourceChunk });
                        this.additionalChunkAssets.push(filePath);
                        this.assets[filePath] = new IndexHtmlSource(sourceModule, sourceChunk, this);
                        sourceChunk.files.push(filePath);
                    }
                }, this);
            });
        });

        compiler.plugin('emit', function emit(compilation, callback) {

            Object.keys(compilation.assets).forEach(function (file) {
                Object.keys(compilation.namedChunks).forEach(function (source) {
                    if (matches(source)) {
                        var targetFile = file;
                        var queryStringIdx = targetFile.indexOf('?');
                        if (queryStringIdx >= 0) {
                            targetFile = targetFile.substr(0, queryStringIdx);
                        }

                        if (targetFile === source + '.js' || targetFile === source + '.js.map') {
                            delete compilation.assets[file];
                        }
                    }
                });
            });

            callback();
        });
    };
}


module.exports = IndexHtmlPlugin;

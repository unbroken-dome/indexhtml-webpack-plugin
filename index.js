var IndexHtmlSource = require('./IndexHtmlSource');


function IndexHtmlPlugin(source, target) {

    this.apply = function apply(compiler) {

        compiler.plugin('this-compilation', function (compilation) {

            compilation.plugin('additional-chunk-assets', function additionalChunkAssets() {

                var sourceChunk = this.namedChunks[source];
                var sourceModule = sourceChunk.origins[0].module;

                var filePath = this.getPath(target, {chunk: sourceChunk});
                this.additionalChunkAssets.push(filePath);
                this.assets[filePath] = new IndexHtmlSource(sourceModule, sourceChunk, this);
                sourceChunk.files.push(filePath);
            });
        });

        compiler.plugin('emit', function emit(compilation, callback) {

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
        });
    };
}


module.exports = IndexHtmlPlugin;
var webpack = require('webpack');
var helpers = require('./helpers');

var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {

    debug: false,

    devtool: 'cheap-module-source-map',

    entry: {
        'ng-gridview': './src/gridview.ts'
    },

    output: {
        path: helpers.root('dist'),
        filename: '[name].js',
        sourceMapFilename: '[name].map',
        chunkFilename: '[id].chunk.js',
        // library: 'ngGridview',
        libraryTarget: 'umd',
    },
    // Options affecting the resolving of modules.
    //
    // See: http://webpack.github.io/docs/configuration.html#resolve
    resolve: {

        // An array of extensions that should be used to resolve modules.
        //
        // See: http://webpack.github.io/docs/configuration.html#resolve-extensions
        extensions: ['', '.ts', '.js'],

        root: helpers.root('src'),

        // remove other default values
        modulesDirectories: ['node_modules']

    },
    // Options affecting the normal modules.
    //
    // See: http://webpack.github.io/docs/configuration.html#module
    module: {

        // An array of applied pre and post loaders.
        //
        // See: http://webpack.github.io/docs/configuration.html#module-preloaders-module-postloaders
        preLoaders: [

            // Tslint loader support for *.ts files
            //
            // See: https://github.com/wbuchwalter/tslint-loader
            // { test: /\.ts$/, loader: 'tslint-loader', exclude: [ helpers.root('node_modules') ] },

            // Source map loader support for *.js files
            // Extracts SourceMaps for source files that as added as sourceMappingURL comment.
            //
            // See: https://github.com/webpack/source-map-loader
            {
                test: /\.js$/,
                loader: 'source-map-loader',
                exclude: [
                    // these packages have problems with their sourcemaps
                    helpers.root('node_modules/rxjs')
                ]
            }

        ],
        // An array of automatically applied loaders.
        //
        // IMPORTANT: The loaders here are resolved relative to the resource which they are applied to.
        // This means they are not resolved relative to the configuration file.
        //
        // See: http://webpack.github.io/docs/configuration.html#module-loaders
        loaders: [

            // Typescript loader support for .ts and Angular 2 async routes via .async.ts
            //
            // See: https://github.com/s-panferov/awesome-typescript-loader
            {
                test: /\.ts$/,
                loader: 'awesome-typescript-loader',
                exclude: [/\.(spec|e2e)\.ts$/]
            },

            // Json loader support for *.json files.
            //
            // See: https://github.com/webpack/json-loader
            {
                test: /\.json$/,
                loader: 'json-loader'
            },

            // Raw loader support for *.html
            // Returns file content as string
            //
            // See: https://github.com/webpack/raw-loader
            {
                test: /\.html$/,
                loader: 'raw-loader',
                exclude: [helpers.root('playground/index.html')]
            },

            {
                test: /\.scss/,
                loader: 'css-loader!sass-loader'
            },
            {
                test: /\.eot(\?.+)?$/,
                loader: "file"
            },
            {
                test: /\.(woff|woff2)(\?.+)?$/,
                loader: "url?limit=5000&minetype=application/font-woff"
            },
            {
                test: /\.ttf(\?.+)?$/,
                loader: "url?limit=10000&mimetype=application/octet-stream"
            },
            {
                test: /\.svg(\?.+)?$/,
                loader: "url?limit=10000&mimetype=image/svg+xml"
            }
        ]
    },

    plugins: [
        new CopyWebpackPlugin([{
            from: 'src/gridview.d.ts',
            to: './ng-gridview.d.ts'
        }, {
            from: 'src/gridview.scss',
            to: './ng-gridview.scss'
        }])
    ],
    
    node: {
        global: 'window',
        crypto: 'empty',
        process: true,
        module: false,
        clearImmediate: false,
        setImmediate: false
    }
};

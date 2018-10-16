module.exports = {
  mode: 'production',
  entry: `${__dirname}/src/Phar.ts`,
  output: {
    path: `${__dirname}/lib/webpack`,
    filename: 'Phar.js',
    library: 'phar',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    // Resolve "window is not defined" error in webpack 4
    globalObject: "this",
  },

  resolve: {
    extensions: ['.ts', '.js', '.json']
  },

  module: {
    rules: [{
      test: /\.ts?$/,
      options: {
        compilerOptions: {
          declarationDir: './lib/webpack'
        }
      },
      loader: 'ts-loader'
    },{
      enforce: 'pre',
      test: /\.js$/,
      loader: 'source-map-loader'
    }]
  },

  optimization: {
    minimize: true
  },
}

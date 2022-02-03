import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import webpack from 'webpack'

const devMode = process.env.NODE_ENV === 'development'

// @ts-ignore module is set to es2020
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {webpack.Configuration} */
const config = {
  mode: devMode ? 'development' : 'production',
  entry: {
    main: './src/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    module: true,
    libraryTarget: 'module',
    publicPath: '/',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
  },
  devtool: devMode ? 'inline-cheap-module-source-map' : 'source-map',
  experiments: {
    outputModule: true,
    topLevelAwait: true,
    futureDefaults: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  target: 'async-node16',
  plugins: [
    // eslint-disable-next-line @typescript-eslint/naming-convention
    new webpack.EnvironmentPlugin({ WEBPACK: true }),
    new webpack.NormalModuleReplacementPlugin(/\.js$/, (resource) => {
      resource.request = resource.request.replace('.js', '')
    }),
    new ForkTsCheckerWebpackPlugin(),
  ].filter(Boolean),
  externalsType: 'module',
  externals: /^[^.][a-z\-0-9@/.]+$/,
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
      },
      {
        test: /\.tsx?$/,
        use: 'swc-loader',
        exclude: /node_modules/,
      },
    ],
  },
}

export default config

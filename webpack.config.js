import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import webpack from 'webpack'

const devMode = process.env.NODE_ENV === 'development'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('webpack').Configuration} */
export default {
  mode: devMode ? 'development' : 'production',
  entry: {
    main: './src/index.ts',
    // imagetest: './src/imagetest.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    module: true,
    libraryTarget: 'module',
  },
  experiments: {
    outputModule: true,
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
  ],
  externalsType: 'module',
  externals: /^[^.][a-z\-0-9@/.]+$/,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'swc-loader',
        exclude: /node_modules/,
      },
    ],
  },
}

import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { fileURLToPath } from 'url';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { VueLoaderPlugin } from 'vue-loader';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export default {
  devtool: 'cheap-module-source-map',
  context: path.resolve(__dirname, 'src'),
  entry: {
    options: './options/index.js',
    popup: './popup/index.js',
    background: './background/index.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '.',
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.styl(us)?$/,
        use: ['style-loader', 'css-loader', 'stylus-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]',
        },
      },
      
    ],
  },
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.runtime.esm-bundler.js',
      bulma$: 'bulma/css/bulma.css',
    },
    extensions: ['.js'],
  },
  plugins: [
    new VueLoaderPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'assets', to: 'assets' },
        { from: 'manifest.json', to: 'manifest.json' },
        { from: '_locales', to: '_locales' }
      ]
    }),
    new HtmlWebpackPlugin({
      title: 'Options',
      template: './index.html',
      inject: true,
      chunks: ['manifest', 'vendor', 'options'],
      filename: 'options.html',
    }),
    new HtmlWebpackPlugin({
      title: 'Popup',
      template: './index.html',
      inject: true,
      chunks: ['manifest', 'vendor', 'popup'],
      filename: 'popup.html',
    }),
  ],
}

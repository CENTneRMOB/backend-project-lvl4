import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(path.dirname(import.meta.url));

const mode = process.env.NODE_ENV || 'development';

export default {
  mode,
  devtool: 'source-map',
  // entry: path.join(__dirname, 'src', 'index.js'),
  output: {
    path: path.join(__dirname, 'dist', 'public'),
    // publicPath: '/assets/',
  },
  devServer: {
    host: 'localhost',
    // contentBase: path.join(__dirname, 'dist', 'public'),
    publicPath: '/assets/',
    port: 8080,
    compress: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [new MiniCssExtractPlugin()],
};

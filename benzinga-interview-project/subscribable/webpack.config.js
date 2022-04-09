// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  cache: {
    type: 'filesystem',
  },
  devtool: isProduction ? 'source-map' : 'source-map',
  entry: './src/index.ts',
  module: {
    rules: [
      {
        enforce: 'pre',
        exclude: /node_modules/,
        test: /\.(ts|tsx)$/,
        use: [
          {
            loader: require.resolve('eslint-loader'),
            options: {
              eslintPath: require.resolve('eslint'),
            },
          },
        ],
      },
      {
        test: /\.worker\.js$/,
        type: 'asset/source',
      },
      {
        exclude: /node_modules/,
        test: /\.tsx?$/,
        use: ['ts-loader'],
      },
    ],
  },
  output: {
    filename: 'index.js',
    globalObject: 'this',
    library: 'subscribable',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};

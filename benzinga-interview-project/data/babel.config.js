const presets = [
  [
    '@babel/preset-env',
    {
      corejs: 3,
      targets: {
        chrome: '67',
        edge: '17',
        firefox: '60',
        safari: '11.1',
      },
      useBuiltIns: 'usage',
    },
  ],
  '@babel/preset-react',
  [
    '@babel/preset-typescript',
    {
      allExtensions: true,
      isTSX: true,
    },
  ],
];

const plugins = [
  ['@babel/plugin-proposal-class-properties', { loose: true }],
  '@babel/plugin-proposal-object-rest-spread',
  [
    '@babel/plugin-transform-runtime',
    {
      corejs: 3,
      helpers: true,
      regenerator: true,
      useESModules: true,
    },
  ],
  'babel-plugin-styled-components',
];

module.exports = {
  plugins,
  presets,
};

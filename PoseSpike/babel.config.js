module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // babel-preset-expo (SDK 58) auto-adds react-native-worklets/plugin or
      // react-native-reanimated/plugin when either package is resolvable.
      // Neither is a dependency here; disabling both guarantees they never run
      // alongside the react-native-worklets-core plugin.
      ['babel-preset-expo', { worklets: false, reanimated: false }],
    ],
    plugins: ['react-native-worklets-core/plugin'],
  };
};

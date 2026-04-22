module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      "nativewind/babel",
      "react-native-reanimated/plugin", // O Reanimated TEM que ser o último da lista
    ],
  };
};
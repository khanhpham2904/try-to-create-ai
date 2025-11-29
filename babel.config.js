module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Enable import.meta polyfill for FFmpeg compatibility
          unstable_transformImportMeta: true,
        },
      ],
    ],
    plugins: [
      // Add plugin for better React Native 0.76+ compatibility
      '@babel/plugin-transform-runtime',
    ],
  };
}; 
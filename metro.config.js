const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration for React Native 0.76+
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Ensure proper module resolution for TurboModules
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add support for TypeScript files
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

// Exclude FFmpeg worker files from bundling
config.resolver.blockList = [
  /node_modules\/@ffmpeg\/ffmpeg\/dist\/esm\/worker\.js$/,
  /node_modules\/@ffmpeg\/ffmpeg\/dist\/umd\/worker\.js$/,
];

// Add transformer configuration for better compatibility
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;

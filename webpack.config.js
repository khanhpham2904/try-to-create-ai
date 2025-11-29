const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@ffmpeg/util'],
      },
    },
    argv
  );

  // Configure externals to prevent bundling FFmpeg worker
  config.externals = config.externals || {};
  
  // Function to externalize FFmpeg worker files
  function externalizeWorker(context, request, callback) {
    if (request.includes('@ffmpeg/ffmpeg') && request.includes('worker')) {
      // Return empty module for worker files
      return callback(null, 'commonjs ' + request);
    }
    callback();
  }

  // Add externals function
  if (!Array.isArray(config.externals)) {
    config.externals = [config.externals || {}];
  }
  config.externals.push(externalizeWorker);
  
  // Ignore warnings about FFmpeg worker dynamic imports
  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    {
      module: /@ffmpeg\/ffmpeg.*worker\.js/,
      message: /Critical dependency/,
    },
    {
      module: /@ffmpeg\/ffmpeg.*worker\.js/,
      message: /Can't resolve/,
    },
    /@ffmpeg\/ffmpeg.*worker\.js/,
  ];

  // Add resolve alias to prevent bundling worker files
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    // Prevent worker.js from being resolved during build
    '@ffmpeg/ffmpeg/dist/esm/worker.js': path.resolve(__dirname, 'src/ffmpeg-worker-stub.js'),
  };

  // Configure module rules to handle FFmpeg worker
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];

  return config;
};


const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

if (!config.resolver.sourceExts.includes('sql')) {
  config.resolver.sourceExts.push('sql');
}

if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}

module.exports = config;

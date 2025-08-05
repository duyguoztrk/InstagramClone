const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Expo Router için gerekli ayarlar
config.resolver.unstable_enableSymlinks = true;

// Metro cache'ini devre dışı bırak
config.cacheStores = [];

module.exports = config;

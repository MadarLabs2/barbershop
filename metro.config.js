const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reduce file watching to prevent EMFILE errors
config.watchFolders = [__dirname];
config.resolver.blockList = [
  /node_modules\/.*\/node_modules\/react-native\/.*/,
  /whatsapp[/\\].*/, // Exclude WhatsApp service (avoids ENOENT on .wwebjs_auth session files)
];

module.exports = config;

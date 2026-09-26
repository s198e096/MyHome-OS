const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// This app lives inside the web app's repo. Metro's default hierarchical
// node_modules lookup would otherwise walk up into the web app's (different
// version) React install and cause duplicate-React bugs. Restrict
// resolution to this folder's own node_modules only.
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];

module.exports = withNativeWind(config, { input: "./global.css" });

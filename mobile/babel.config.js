// =============================================================================
// babel.config.js — Reanimated debe ser SIEMPRE el último plugin.
// Tamagui removido por problemas de bundle JS con el babel plugin.
// Usamos StyleSheet + fontFamily Mulish directo, look idéntico.
// =============================================================================

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};

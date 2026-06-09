// =============================================================================
// babel.config.js — Babel config con plugin de Tamagui (compile-time CSS).
// Reanimated debe ser SIEMPRE el último plugin.
// =============================================================================

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts',
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === 'development',
        },
      ],
      // Reanimated debe ser el ÚLTIMO plugin (regla obligatoria del package).
      'react-native-reanimated/plugin',
    ],
  };
};

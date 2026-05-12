import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
// @vitejs/plugin-vue is not hoisted to root node_modules in this pnpm setup;
// import it via its resolved path in the pnpm store.
// eslint-disable-next-line import/no-relative-packages
import vue from './node_modules/.pnpm/@vitejs+plugin-vue@6.0.4_vite@7.3.1_@types+node@25.4.0_jiti@2.6.1_sass@1.97.3_terser@5._06631c7bc8350001f768240ea2efdde0/node_modules/@vitejs/plugin-vue/dist/index.mjs';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '@': fileURLToPath(new URL('./', import.meta.url)),
      pinia: fileURLToPath(new URL('./node_modules/.pnpm/node_modules/pinia', import.meta.url)),
    },
  },
});

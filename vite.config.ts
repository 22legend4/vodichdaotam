import { defineConfig } from 'vite';

/** itch.io cần base tương đối; Vercel/production dùng `/`. */
export default defineConfig(({ mode }) => ({
  base: mode === 'itch' ? './' : '/',
  build: {
    outDir: mode === 'itch' ? 'dist-itch' : 'dist',
    emptyOutDir: true,
  },
}));

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@quizmaster/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  base: '/QuizMaster/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

import copy from 'rollup-plugin-copy';
import scss from 'rollup-plugin-scss';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      input: 'src/module.ts',
      output: {
        dir: undefined,
        file: 'dist/scripts/module.js',
        format: 'es',
      },
    },
  },
  plugins: [
    scss({
      verbose: true,
      output: 'dist/style.css',
      sourceMap: true,
      watch: ['src/*.scss'],
    }),
    copy({
      targets: [
        { src: 'module.json', dest: 'dist' },
        { src: 'assets', dest: 'dist' },
        { src: 'templates', dest: 'dist' },
      ],
      hook: 'writeBundle',
    }),
  ],
});

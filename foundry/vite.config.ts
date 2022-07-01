import * as fsPromises from 'fs/promises';
import copy from 'rollup-plugin-copy';
import scss from 'rollup-plugin-scss';
import { defineConfig, Plugin } from 'vite';

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
    updateModuleManifestPlugin(),
    scss({
      verbose: true,
      output: 'dist/style.css',
      sourceMap: true,
      watch: ['src/styles/*.scss'],
    }),
    copy({
      targets: [
        { src: 'src/assets', dest: 'dist' },
        { src: 'src/templates', dest: 'dist' },
      ],
      hook: 'writeBundle',
    }),
  ],
});

function updateModuleManifestPlugin(): Plugin {
  return {
    name: 'update-module-manifest',
    async writeBundle(options, bundle): Promise<void> {
      const packageContents = JSON.parse(
        await fsPromises.readFile('./package.json', 'utf-8'),
      ) as Record<string, unknown>;
      const version = packageContents.version as string;
      const name = packageContents.name as string;
      const manifestContents: string = await fsPromises.readFile(
        'src/module.json',
        'utf-8',
      );
      const manifestJson = JSON.parse(manifestContents) as Record<
        string,
        unknown
      >;
      const baseUrl = 'https://bfdist.us-east-1.linodeobjects.com/foundry';
      manifestJson['version'] = version;
      manifestJson['manifest'] = `${baseUrl}/module.json`;
      manifestJson['download'] = `${baseUrl}/${name}-${version}.zip`;
      await fsPromises.writeFile(
        'dist/manifest.json',
        JSON.stringify(manifestJson),
      );
    },
  };
}

import * as fsPromises from 'fs/promises';
import { resolve } from 'path'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/module.ts'),
      name: 'Campaign Composer Bridge',
      fileName: 'scripts/module',
    },
    target: 'esnext',
  },
  plugins: [
    updateModuleManifestPlugin(),
    svelte(),
    // copy({
    //   targets: [
    //     { src: 'src/assets', dest: 'dist' },
    //     { src: 'src/templates', dest: 'dist' },
    //   ],
    //   hook: 'writeBundle',
    // }),
  ],
})

function updateModuleManifestPlugin(): Plugin {
  return {
    name: 'update-module-manifest',
    async writeBundle(): Promise<void> {
      const packageContents = JSON.parse(
        await fsPromises.readFile('./package.json', 'utf-8'),
      ) as Record<string, unknown>;
      const version = packageContents.version as string;
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
      manifestJson['download'] = `${baseUrl}/release-${version}.zip`;
      await fsPromises.writeFile(
        'dist/module.json',
        JSON.stringify(manifestJson),
      );
    },
  };
}
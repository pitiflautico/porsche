// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, '..');

// https://astro.build/config
export default defineConfig({
  site: 'https://porschereunions.com',
  output: 'static',
  adapter: netlify(),
  vite: {
    envDir: rootEnv,
    envPrefix: 'PUBLIC_',
  },
});

import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Target Unreal Project Content/UI directory
const OUTPUT_DIR = resolve(__dirname, '../../Content/UI');

const APPS = [
  { name: 'hud', html: 'hud.html' },
  { name: 'pause_menu', html: 'pause_menu.html' },
];

async function buildApp(app) {
  const root = resolve(__dirname);
  const outDir = OUTPUT_DIR;

  console.log(`\n========================================`);
  console.log(`  Building ${app.name} (${app.html})...`);
  console.log(`========================================\n`);

  await build({
    root,
    plugins: [react(), viteSingleFile()],
    base: './',
    build: {
      outDir,
      emptyOutDir: false,
      target: 'esnext',
      assetsInlineLimit: 100000000,
      chunkSizeWarningLimit: 100000000,
      cssCodeSplit: false,
      rollupOptions: {
        input: resolve(root, app.html),
        inlineDynamicImports: true,
        output: {
          manualChunks: undefined,
          entryFileNames: `[name].js`,
          assetFileNames: `[name].[ext]`,
        },
      },
    },
    configFile: false,
  });
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const app of APPS) {
    await buildApp(app);
  }

  console.log(`\nAll SWUI single-file bundles built cleanly into ${OUTPUT_DIR}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


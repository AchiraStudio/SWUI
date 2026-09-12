import { defineSwuiConfig } from '@swui/cli';

export default defineSwuiConfig({
  name: 'MainHUD',
  framework: 'react',
  entry: './src/main.tsx',
  output: './dist',
  runtime: {
    frameRate: 60,
    priority: 'high',
    persistent: true,
    layer: 'persistent',
    loadBehavior: 'eager',
  },
});

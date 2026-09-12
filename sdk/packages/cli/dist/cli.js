import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
export function runCli(args) {
    const command = args[0] || 'help';
    switch (command) {
        case 'build': {
            const isProduction = args.includes('--production') || !args.includes('--dev');
            console.log(`[SWUI CLI] Building web application in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode...`);
            if (isProduction) {
                process.env.NODE_ENV = 'production';
            }
            const cwd = process.cwd();
            const hasViteConfig = existsSync(resolve(cwd, 'vite.config.ts')) || existsSync(resolve(cwd, 'vite.config.js'));
            const hasNextConfig = existsSync(resolve(cwd, 'next.config.js')) || existsSync(resolve(cwd, 'next.config.mjs'));
            let runner = 'npm';
            let runnerArgs = ['run', 'build'];
            if (hasNextConfig) {
                console.log('[SWUI CLI] Detected Next.js static export project.');
            }
            else if (hasViteConfig) {
                console.log('[SWUI CLI] Detected Vite project.');
            }
            const child = spawn(runner, runnerArgs, {
                cwd,
                stdio: 'inherit',
                shell: true,
            });
            child.on('close', (code) => {
                if (code === 0) {
                    console.log('[SWUI CLI] Build completed successfully.');
                }
                else {
                    console.error(`[SWUI CLI] Build failed with exit code ${code}.`);
                    process.exit(code ?? 1);
                }
            });
            break;
        }
        case 'dev': {
            console.log('[SWUI CLI] Starting live development server with hot-reload...');
            const child = spawn('npm', ['run', 'dev'], {
                cwd: process.cwd(),
                stdio: 'inherit',
                shell: true,
            });
            child.on('close', (code) => {
                process.exit(code ?? 0);
            });
            break;
        }
        case 'help':
        default: {
            console.log(`
SWUI 3.0 CLI — Web Application Runtime for Unreal Engine

Usage:
  swui <command> [options]

Commands:
  build [--production]   Builds the web application into production static assets
  dev                    Starts the development server with live reload
  help                   Displays this help message
`);
            break;
        }
    }
}

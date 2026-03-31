import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: path.join(__dirname, 'frontend'),
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.join(__dirname, 'frontend', 'src')
        }
    },
    preview: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    }
});

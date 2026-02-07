import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Charge les variables d'environnement (ex: .env)
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      
      // On expose la clé API pour qu'elle soit accessible via import.meta.env.VITE_GEMINI_API_KEY
      // Note : Vite charge automatiquement les variables commençant par VITE_
      define: {
        'process.env': env,
      },

      build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
          // Si html2pdf est chargé via CDN dans index.html, 
          // on dit à Vite de ne pas essayer de l'installer/compiler
          external: [], 
        },
      },

      resolve: {
        alias: {
          // Permet d'utiliser @/components/ au lieu de ./components/
          '@': path.resolve(__dirname, './'),
        },
      },
    };
});
import { defineConfig } from 'vite'
import adonisjs from '@adonisjs/vite/client'

export default defineConfig({
  plugins: [
    adonisjs({
      /**
       * Entrypoints of your application. Each entrypoint will
       * result in a separate bundle.
       */
      entrypoints: ['resources/js/app.js'],

      /**
       * Paths to watch and reload the browser on file change
       */
      reload: ['resources/views/**/*.edge'],
    }),
  ],
  // add css sourcemap
  css: {
    devSourcemap: true,
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    manifest: true,
    outDir: 'public/assets',
    rollupOptions: {
      input: {
        app: 'resources/js/app.js',
      },
    },
  },
})

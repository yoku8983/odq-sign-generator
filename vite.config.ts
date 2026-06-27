import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

export default defineConfig({
  plugins: [
    svelte(),
    process.env.ANALYZE &&
      visualizer({
        filename: 'dist/bundle-stats.html',
        gzipSize: true,
        template: 'treemap',
      }),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: 'es2023',
    modulePreload: false,
    rolldownOptions: {
      output: {
        minify: {
          compress: {
            dropConsole: true,
            dropDebugger: true,
          },
        },
      },
    },
  },
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})

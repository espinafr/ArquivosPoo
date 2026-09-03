import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  base: '/ArquivosPoo/',
  build: {
    rolldownOptions: {
      input: Object.fromEntries(
        fs.readdirSync(__dirname).filter(file => file.endsWith('.html')).map(file => [
          path.basename(file, '.html'),
          path.resolve(__dirname, file)
        ])
      )
    }
  }
})
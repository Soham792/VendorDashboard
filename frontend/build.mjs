import { build } from 'vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

async function buildProject() {
  try {
    console.log('Starting Vite build using programmatic API...')
    
    await build({
      root: __dirname,
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          input: resolve(__dirname, 'index.html')
        }
      },
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    })
    
    console.log('Build completed successfully!')
  } catch (error) {
    console.error('Build failed:', error)
    process.exit(1)
  }
}

buildProject()

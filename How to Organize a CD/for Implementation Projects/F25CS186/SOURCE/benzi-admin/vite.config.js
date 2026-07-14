import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiPort = env.VITE_PROXY_API_PORT || '5000'
  const target = `http://127.0.0.1:${apiPort}`

  return {
    plugins: [
      tailwindcss(),
      react(),
    ],
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('error', (err) => {
              console.error(
                `[vite proxy /api -> ${target}] ${err.code || ''} ${err.message} — Is benzi-server running on port ${apiPort}?`
              )
            })
          },
        },
      },
    },
  }
})

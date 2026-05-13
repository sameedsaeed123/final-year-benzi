import 'dotenv/config'
import app from './src/app.js'
import { validateEnv, env } from './src/config/environment.js'
import { connectDB } from './src/config/database.js'

async function main() {
  validateEnv()
  await connectDB()
  const host = env.LISTEN_HOST
  const server = app.listen(env.PORT, host, () => {
    console.log(`Benzi API listening on http://${host}:${env.PORT}`)
  })
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `[Benzi API] Port ${env.PORT} is already in use on ${host}. Stop the other process (e.g. lsof -i :${env.PORT}) or set PORT in benzi-server/.env`
      )
      process.exit(1)
    }
    throw err
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

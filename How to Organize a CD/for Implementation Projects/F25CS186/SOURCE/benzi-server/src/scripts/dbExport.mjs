/**
 * Export the current BENZI MongoDB to ./data/benzi-dump (or DB_DUMP_DIR).
 * Requires MongoDB Database Tools: mongodump on PATH.
 *
 * On your MAIN machine (where real data lives):
 *   Set MONGODB_URI (or SOURCE_MONGODB_URI) in .env to that database, then:
 *   npm run db:export
 */
import 'dotenv/config'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeMongoUri, ensureAuthSource } from '../config/database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.resolve(__dirname, '../..')

function resolveUri() {
  const raw = process.env.SOURCE_MONGODB_URI || process.env.MONGODB_URI
  if (!raw) {
    console.error('Set SOURCE_MONGODB_URI or MONGODB_URI in benzi-server/.env')
    process.exit(1)
  }
  return ensureAuthSource(normalizeMongoUri(raw))
}

function main() {
  const uri = resolveUri()
  const dumpDir = path.resolve(
    serverRoot,
    process.env.DB_DUMP_DIR || 'data/benzi-dump'
  )

  if (fs.existsSync(dumpDir)) {
    console.log(`Removing previous dump: ${dumpDir}`)
    fs.rmSync(dumpDir, { recursive: true, force: true })
  }
  fs.mkdirSync(path.dirname(dumpDir), { recursive: true })

  const masked = uri.replace(/:([^:@/]+)@/, ':****@')
  console.log(`Exporting from: ${masked}`)
  console.log(`Output folder: ${dumpDir}`)

  const result = spawnSync('mongodump', ['--uri', uri, '--out', dumpDir], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })

  if (result.error?.code === 'ENOENT') {
    console.error('\nmongodump not found. Install MongoDB Database Tools:')
    console.error('  https://www.mongodb.com/try/download/database-tools')
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)

  console.log('\n✅ Export complete.')
  console.log('\nNext steps:')
  console.log(`  1. Zip folder: ${dumpDir}`)
  console.log('  2. Copy zip to Dell (USB / network)')
  console.log('  3. On Dell: unzip into benzi-server/data/benzi-dump')
  console.log('  4. Set benzi-server/.env → MONGODB_URI=mongodb://127.0.0.1:27017/benzi')
  console.log('  5. On Dell: npm run db:import')
  console.log('\nSee benzi-server/docs/COPY_DATABASE_TO_LOCAL.md')
}

main()

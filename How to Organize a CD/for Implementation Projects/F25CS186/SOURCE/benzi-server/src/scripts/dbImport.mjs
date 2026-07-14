/**
 * Import ./data/benzi-dump into MONGODB_URI (use local URI on Dell).
 * Requires MongoDB Database Tools: mongorestore on PATH.
 */
import 'dotenv/config'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeMongoUri, ensureAuthSource } from '../config/database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.resolve(__dirname, '../..')

function resolveTargetUri() {
  const raw = process.env.MONGODB_URI
  if (!raw) {
    console.error('Set MONGODB_URI in benzi-server/.env (Dell: mongodb://127.0.0.1:27017/benzi)')
    process.exit(1)
  }
  return ensureAuthSource(normalizeMongoUri(raw))
}

function findDumpRoot(dumpDir) {
  if (!fs.existsSync(dumpDir)) return null
  const benziSub = path.join(dumpDir, 'benzi')
  if (fs.existsSync(benziSub) && fs.statSync(benziSub).isDirectory()) {
    return dumpDir
  }
  const entries = fs.readdirSync(dumpDir, { withFileTypes: true })
  const dbDirs = entries.filter((e) => e.isDirectory()).map((e) => path.join(dumpDir, e.name))
  if (dbDirs.length === 1) return dumpDir
  if (dbDirs.length > 1) return dumpDir
  return null
}

function main() {
  const uri = resolveTargetUri()
  const dumpDir = path.resolve(
    serverRoot,
    process.env.DB_DUMP_DIR || 'data/benzi-dump'
  )

  if (!findDumpRoot(dumpDir)) {
    console.error(`Dump folder missing or empty: ${dumpDir}`)
    console.error('Run npm run db:export on your main PC, copy data/benzi-dump here, then retry.')
    process.exit(1)
  }

  const masked = uri.replace(/:([^:@/]+)@/, ':****@')
  console.log(`Importing into: ${masked}`)
  console.log(`From folder: ${dumpDir}`)
  console.warn('\n⚠️  --drop will replace existing collections in the target database.\n')

  const result = spawnSync(
    'mongorestore',
    ['--uri', uri, '--drop', dumpDir],
    { stdio: 'inherit', shell: process.platform === 'win32' }
  )

  if (result.error?.code === 'ENOENT') {
    console.error('\nmongorestore not found. Install MongoDB Database Tools:')
    console.error('  https://www.mongodb.com/try/download/database-tools')
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)

  console.log('\n✅ Import complete. Log in with the same emails/passwords as on the source DB.')
  console.log('Start API: npm run dev (from repo root)')
}

main()

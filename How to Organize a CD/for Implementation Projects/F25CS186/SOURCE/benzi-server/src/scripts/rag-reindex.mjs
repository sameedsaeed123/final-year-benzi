#!/usr/bin/env node
/**
 * Index all patient records into vector RAG (MongoDB chunks + Ollama embeddings).
 * Requires: RAG_ENABLED=true, Ollama running, ollama pull nomic-embed-text
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { Record } from '../models/Record.js'
import { extractRecordTextForRag } from '../services/recordTextForRag.js'
import { indexRecordForRag, isRagEnabled } from '../services/vectorRagService.js'

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/benzi'

async function main() {
  if (!isRagEnabled()) {
    console.error('Set RAG_ENABLED=true in benzi-server/.env')
    process.exit(1)
  }

  await mongoose.connect(uri)
  const records = await Record.find({ deletedAt: null }).sort({ createdAt: -1 }).lean()
  console.log(`Reindexing ${records.length} records…`)

  let ok = 0
  let skip = 0
  for (const r of records) {
    const body = await extractRecordTextForRag(r)
    const result = await indexRecordForRag(r.patientUserId, r._id, {
      title: r.title,
      type: r.type,
      bodyText: body,
    })
    if (result.indexed) {
      ok += 1
      console.log(`  ✓ ${r._id} (${result.chunks} chunks)`)
    } else {
      skip += 1
      console.log(`  – ${r._id} (${result.reason || 'skipped'})`)
    }
  }

  console.log(`Done: ${ok} indexed, ${skip} skipped`)
  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

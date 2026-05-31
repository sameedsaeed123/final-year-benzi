/**
 * Vector RAG: chunk clinical text → Ollama embeddings → MongoDB → cosine search per patient.
 * Enable with RAG_ENABLED=true (requires Ollama + nomic-embed-text).
 */
import { RecordChunk } from '../models/RecordChunk.js'
import { embedText, checkEmbeddingHealth } from './embeddingService.js'
import { getVectorSearchMode, searchVectors, shouldUseAtlasVectorSearch } from './vectorRagSearch.js'

const CHUNK_SIZE = Number(process.env.RAG_CHUNK_SIZE) || 700
const CHUNK_OVERLAP = Number(process.env.RAG_CHUNK_OVERLAP) || 80
const TOP_K = Number(process.env.RAG_TOP_K) || 5

const queryEmbedCache = new Map()
const QUERY_CACHE_TTL_MS = 120_000
const QUERY_CACHE_MAX = 200

export function isRagEnabled() {
  return String(process.env.RAG_ENABLED || '').toLowerCase() === 'true'
}

export function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return []
  if (clean.length <= size) return [clean]

  const chunks = []
  let start = 0
  while (start < clean.length) {
    chunks.push(clean.slice(start, start + size))
    if (start + size >= clean.length) break
    start += size - overlap
  }
  return chunks
}

async function embedQueryCached(patientUserId, query) {
  const key = `${patientUserId}:${query.slice(0, 200)}`
  const hit = queryEmbedCache.get(key)
  if (hit && Date.now() - hit.at < QUERY_CACHE_TTL_MS) return hit.vec

  const vec = await embedText(query)
  if (vec) {
    queryEmbedCache.set(key, { vec, at: Date.now() })
    if (queryEmbedCache.size > QUERY_CACHE_MAX) {
      const first = queryEmbedCache.keys().next().value
      queryEmbedCache.delete(first)
    }
  }
  return vec
}

/**
 * Index one record's text (replaces prior chunks for that record).
 */
export async function indexRecordForRag(patientUserId, recordId, { title, type, bodyText }) {
  if (!isRagEnabled()) return { indexed: false, reason: 'disabled' }

  const text = String(bodyText || '').trim()
  if (text.length < 40) {
    return { indexed: false, reason: 'text_too_short', chunks: 0 }
  }

  await RecordChunk.deleteMany({ recordId })

  const parts = chunkText(text)
  let stored = 0

  for (let i = 0; i < parts.length; i++) {
    try {
      const embedding = await embedText(parts[i])
      if (!embedding) continue
      await RecordChunk.create({
        patientUserId,
        recordId,
        chunkIndex: i,
        text: parts[i],
        embedding,
        title: title || 'Clinical document',
        recordType: type || 'record',
      })
      stored += 1
    } catch (err) {
      console.warn(`[RAG] embed chunk ${i} for record ${recordId}:`, err.message)
    }
  }

  return { indexed: stored > 0, chunks: stored }
}

export async function deleteRecordFromRag(recordId) {
  if (!isRagEnabled()) return
  await RecordChunk.deleteMany({ recordId })
}

/**
 * Semantic search → records shaped for aiContextBuilder / aiPromptBuilder.
 */
export async function searchPatientRecordsRag(patientUserId, query) {
  if (!isRagEnabled()) return []

  const q = String(query || '').trim()
  if (q.length < 3) return []

  let queryVec
  try {
    queryVec = await embedQueryCached(patientUserId, q)
  } catch (err) {
    console.warn('[RAG] query embed failed:', err.message)
    return []
  }
  if (!queryVec) return []

  return searchVectors(patientUserId, queryVec)
}

/** Background index after upload / redaction (non-blocking). */
export function scheduleRecordRagIndex(recordDoc) {
  if (!isRagEnabled() || !recordDoc?._id) return
  setImmediate(() => {
    void (async () => {
      try {
        const { Record } = await import('../models/Record.js')
        const { extractRecordTextForRag } = await import('./recordTextForRag.js')
        const fresh = await Record.findById(recordDoc._id).lean()
        if (!fresh || fresh.deletedAt) return
        const bodyText = await extractRecordTextForRag(fresh)
        const result = await indexRecordForRag(fresh.patientUserId, fresh._id, {
          title: fresh.title,
          type: fresh.type,
          bodyText,
        })
        if (result.indexed) {
          console.log(`[RAG] Indexed record ${fresh._id}: ${result.chunks} chunks`)
        }
      } catch (err) {
        console.warn('[RAG] scheduleRecordRagIndex failed:', err.message)
      }
    })()
  })
}

export async function getRagHealth() {
  if (!isRagEnabled()) {
    return { enabled: false, ok: true, message: 'RAG disabled (set RAG_ENABLED=true)' }
  }
  const emb = await checkEmbeddingHealth()
  const chunkCount = await RecordChunk.estimatedDocumentCount().catch(() => 0)
  const vectorMode = getVectorSearchMode()
  const atlasConfigured = shouldUseAtlasVectorSearch()

  return {
    enabled: true,
    ok: emb.ok,
    embedModel: emb.model,
    dimensions: emb.dimensions,
    chunkCount,
    vectorSearch: vectorMode,
    atlasConfigured,
    atlasIndex: process.env.RAG_ATLAS_INDEX || 'benzi_record_chunks_vector',
    message: emb.ok
      ? `RAG active (${chunkCount} chunks, search: ${vectorMode})`
      : `RAG enabled but embeddings failed: ${emb.message}. Run: ollama pull nomic-embed-text`,
  }
}

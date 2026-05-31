/**
 * RAG retrieval: MongoDB Atlas $vectorSearch when available, else in-app cosine similarity.
 */
import mongoose from 'mongoose'
import { RecordChunk } from '../models/RecordChunk.js'

const TOP_K = Number(process.env.RAG_TOP_K) || 5
const MAX_CHUNKS_LOCAL = Number(process.env.RAG_MAX_CHUNKS_SEARCH) || 400
const MIN_SCORE = Number(process.env.RAG_MIN_SCORE) || 0.25

function vectorBackendMode() {
  return (process.env.RAG_VECTOR_BACKEND || 'auto').toLowerCase()
}

/** True when we should attempt Atlas $vectorSearch. */
export function shouldUseAtlasVectorSearch() {
  const mode = vectorBackendMode()
  if (mode === 'local') return false
  if (mode === 'atlas') return true
  const uri = process.env.MONGODB_URI || ''
  return uri.includes('mongodb+srv://') || uri.includes('.mongodb.net')
}

function cosineSimilarity(a, b) {
  let dot = 0
  let na = 0
  let nb = 0
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom > 0 ? dot / denom : 0
}

function mapHits(rows, scoreKey = 'score') {
  return rows.map((c, i) => ({
    id: String(c.recordId),
    type: c.recordType || 'record',
    title: c.title || 'Clinical document',
    description: `Retrieved excerpt ${i + 1} (${scoreKey} ${((c[scoreKey] ?? c.ragScore ?? 0) * 100).toFixed(0)}%)`,
    therapistNotes: '',
    extractedText: c.text,
    hasPdfBody: true,
    ragScore: c[scoreKey] ?? c.ragScore ?? 0,
    chunkIndex: c.chunkIndex,
    ragBackend: c.ragBackend,
  }))
}

export async function searchLocalCosine(patientUserId, queryVec) {
  const chunks = await RecordChunk.find({ patientUserId })
    .sort({ createdAt: -1 })
    .limit(MAX_CHUNKS_LOCAL)
    .lean()

  if (!chunks.length) return []

  const scored = chunks
    .map((c) => ({ ...c, score: cosineSimilarity(queryVec, c.embedding || []), ragBackend: 'local' }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
    .filter((c) => c.score >= MIN_SCORE)

  return mapHits(scored, 'score')
}

export async function searchAtlasVector(patientUserId, queryVec) {
  const indexName = process.env.RAG_ATLAS_INDEX || 'benzi_record_chunks_vector'
  const patientOid = new mongoose.Types.ObjectId(String(patientUserId))

  const pipeline = [
    {
      $vectorSearch: {
        index: indexName,
        path: 'embedding',
        queryVector: queryVec,
        numCandidates: Math.max(TOP_K * 25, 100),
        limit: TOP_K,
        filter: { patientUserId: patientOid },
      },
    },
    {
      $project: {
        text: 1,
        title: 1,
        recordId: 1,
        recordType: 1,
        chunkIndex: 1,
        score: { $meta: 'vectorSearchScore' },
        ragBackend: { $literal: 'atlas' },
      },
    },
  ]

  const rows = await RecordChunk.aggregate(pipeline)
  return mapHits(rows, 'score')
}

let atlasUnavailableLogged = false

export async function searchVectors(patientUserId, queryVec) {
  if (shouldUseAtlasVectorSearch()) {
    try {
      const atlasHits = await searchAtlasVector(patientUserId, queryVec)
      if (atlasHits.length > 0) return atlasHits
    } catch (err) {
      if (!atlasUnavailableLogged) {
        console.warn('[RAG] Atlas vector search unavailable, using local cosine:', err.message)
        atlasUnavailableLogged = true
      }
    }
  }
  return searchLocalCosine(patientUserId, queryVec)
}

export function getVectorSearchMode() {
  if (!shouldUseAtlasVectorSearch()) return 'local'
  return 'atlas-with-local-fallback'
}

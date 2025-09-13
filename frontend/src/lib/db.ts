import type { Settings } from '@/components/settings-panel'
import type { FileMetadata } from '@/hooks/use-file-upload'
import { type DBSchema, openDB } from 'idb'

export type SummaryRecord = {
  id: string
  title: string
  message: string
  answer: string
  settings: Settings
  files: FileMetadata[]
  createdAt: number
  updatedAt: number
}

const DB_NAME = 'tldrify'
const DB_VERSION = 1
const STORE = 'summaries'

type TldrifyDB = DBSchema & {
  summaries: {
    key: string
    value: SummaryRecord
    indexes: {
      updatedAt: number
      createdAt: number
    }
  }
}

const dbPromise = openDB<TldrifyDB>(DB_NAME, DB_VERSION, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE)) {
      const store = db.createObjectStore(STORE, { keyPath: 'id' })
      store.createIndex('createdAt', 'createdAt', { unique: false })
      store.createIndex('updatedAt', 'updatedAt', { unique: false })
    }
  }
})

export async function putSummary(rec: SummaryRecord): Promise<void> {
  const db = await dbPromise
  await db.put(STORE, rec)
}

export async function getSummary(id: string): Promise<SummaryRecord | undefined> {
  const db = await dbPromise
  return db.get(STORE, id)
}

export async function deleteSummary(id: string): Promise<void> {
  const db = await dbPromise
  await db.delete(STORE, id)
}

export async function listSummaries(): Promise<SummaryRecord[]> {
  const db = await dbPromise
  return (await db.getAllFromIndex(STORE, 'updatedAt')).reverse()
}

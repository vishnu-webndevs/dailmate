import { getMysql } from "../db/mysql.js"

export type CallStatus = "starting" | "live" | "ended"

export interface CallRecord {
  id: string
  from?: string
  to?: string
  agentId?: number
  voice?: string
  promptId?: string
  status: CallStatus
  startedAt: Date
  endedAt?: Date
  recordingUrl?: string
}

const inMemory = new Map<string, CallRecord>()

async function init() {
  try {
    const db = getMysql()
    await db.query(`
      CREATE TABLE IF NOT EXISTS calls (
        id VARCHAR(64) PRIMARY KEY,
        \`from\` VARCHAR(64),
        \`to\` VARCHAR(64),
        agentId INT NULL,
        voice VARCHAR(64) NULL,
        promptId VARCHAR(64) NULL,
        status VARCHAR(16),
        startedAt DATETIME,
        endedAt DATETIME NULL,
        recordingUrl TEXT NULL
      )
    `)
  } catch {
    return
  }
}

async function upsert(rec: CallRecord) {
  inMemory.set(rec.id, rec)
  try {
    const db = getMysql()
    await db.query(
      "REPLACE INTO calls (id, `from`, `to`, agentId, voice, promptId, status, startedAt, endedAt, recordingUrl) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [rec.id, rec.from || null, rec.to || null, rec.agentId || null, rec.voice || null, rec.promptId || null, rec.status, rec.startedAt, rec.endedAt || null, rec.recordingUrl || null]
    )
  } catch {
    return
  }
}

async function update(id: string, patch: Partial<CallRecord>) {
  const existing = inMemory.get(id)
  const rec = { ...(existing || { id, status: "starting", startedAt: new Date() }), ...patch }
  await upsert(rec)
}

function live(): CallRecord[] {
  return Array.from(inMemory.values()).filter(c => c.status !== "ended")
}

function get(id: string): CallRecord | undefined {
  return inMemory.get(id)
}

export const callService = { init, upsert, update, live, get }

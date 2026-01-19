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
    await db.query(`
      CREATE TABLE IF NOT EXISTS transcripts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        callId VARCHAR(64) NOT NULL,
        role VARCHAR(16) NOT NULL,
        text TEXT NOT NULL,
        ts DATETIME NOT NULL,
         INDEX idx_call_id (callId)
       )
     `)
     await db.query(`
       CREATE TABLE IF NOT EXISTS metrics (
         id INT AUTO_INCREMENT PRIMARY KEY,
         callId VARCHAR(64) NOT NULL,
         streamSid VARCHAR(64),
         agentId INT,
         llmLatencyMs INT,
         outputLength INT,
         quality FLOAT,
         createdAt DATETIME NOT NULL,
         INDEX idx_call_id (callId)
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

async function addTranscript(callId: string, role: string, text: string) {
  try {
    const db = getMysql()
    await db.query("INSERT INTO transcripts (callId, role, text, ts) VALUES (?, ?, ?, NOW())", [callId, role, text])
  } catch {
    // ignore
  }
}

async function getTranscripts(callId: string) {
  try {
    const db = getMysql()
    const [rows] = await db.query("SELECT role, text, ts FROM transcripts WHERE callId = ? ORDER BY ts ASC", [callId])
    return rows
  } catch {
    return []
  }
}

async function addMetric(data: { callId: string, streamSid: string, agentId?: number, llmLatencyMs: number, outputLength: number, quality: number }) {
  try {
    const db = getMysql()
    await db.query(
      "INSERT INTO metrics (callId, streamSid, agentId, llmLatencyMs, outputLength, quality, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [data.callId, data.streamSid, data.agentId || null, data.llmLatencyMs, data.outputLength, data.quality]
    )
  } catch {
    // ignore
  }
}

export const callService = { init, upsert, update, live, get, addTranscript, getTranscripts, addMetric }

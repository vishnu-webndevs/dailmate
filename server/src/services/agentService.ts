import { getMysql } from "../db/mysql.js"

export type Agent = {
  id: number
  name: string
  description?: string
  promptId?: string
  twilioFrom?: string
  voice?: string
  language: "en" | "hi"
}

async function init() {
  try {
    const db = getMysql()
    await db.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        description TEXT NULL,
        promptId VARCHAR(64) NULL,
        twilioFrom VARCHAR(32) NULL,
        voice VARCHAR(64) NULL,
        language VARCHAR(8) NOT NULL DEFAULT 'en'
      )
    `)
    try {
      await db.query("ALTER TABLE agents ADD COLUMN language VARCHAR(8) NOT NULL DEFAULT 'en'")
    } catch {
      void 0
    }
  } catch {
    return
  }
}

async function list(): Promise<Agent[]> {
  try {
    const db = getMysql()
    const [rows] = await db.query("SELECT id, name, description, promptId, twilioFrom, voice, language FROM agents ORDER BY id ASC")
    return rows as Agent[]
  } catch {
    return []
  }
}

async function getById(id: number): Promise<Agent | undefined> {
  try {
    const db = getMysql()
    const [rows] = await db.query("SELECT id, name, description, promptId, twilioFrom, voice, language FROM agents WHERE id = ? LIMIT 1", [id])
    const r = (rows as Agent[])[0]
    return r
  } catch {
    return undefined
  }
}

async function create(data: Omit<Agent, "id">): Promise<Agent> {
  try {
    const db = getMysql()
    const [res] = await db.query(
      "INSERT INTO agents (name, description, promptId, twilioFrom, voice, language) VALUES (?,?,?,?,?,?)",
      [data.name, data.description || null, data.promptId || null, data.twilioFrom || null, data.voice || null, data.language || "en"]
    )
    const id = Number((res as { insertId?: number }).insertId || 0)
    return { id, ...data, language: data.language || "en" }
  } catch {
    return { id: 0, ...data }
  }
}

async function update(id: number, patch: Partial<Omit<Agent, "id">>): Promise<Agent | undefined> {
  try {
    const db = getMysql()
    const current = await getById(id)
    if (!current) return undefined
    const next = { ...current, ...patch, language: patch.language || current.language || "en" }
    await db.query(
      "UPDATE agents SET name=?, description=?, promptId=?, twilioFrom=?, voice=?, language=? WHERE id=?",
      [next.name, next.description || null, next.promptId || null, next.twilioFrom || null, next.voice || null, next.language || "en", id]
    )
    return next
  } catch {
    return undefined
  }
}

async function remove(id: number): Promise<boolean> {
  try {
    const db = getMysql()
    await db.query("DELETE FROM agents WHERE id = ?", [id])
    return true
  } catch {
    return false
  }
}

async function removeAll() {
  try {
    const db = getMysql()
    await db.query("DELETE FROM agents")
  } catch {
    return
  }
}

export const agentService = { init, list, getById, create, update, remove, removeAll }

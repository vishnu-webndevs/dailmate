import { randomUUID } from "crypto"
import { Prompt, PromptVersion } from "../models/prompt.js"
import { getMysql } from "../db/mysql.js"

async function init() {
  try {
    const db = getMysql()
    await db.query(`
      CREATE TABLE IF NOT EXISTS prompts (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        activeVersion INT NOT NULL
      )
    `)
    await db.query(`
      CREATE TABLE IF NOT EXISTS prompt_versions (
        id VARCHAR(64) PRIMARY KEY,
        promptId VARCHAR(64) NOT NULL,
        version INT NOT NULL,
        content TEXT NOT NULL,
        createdAt DATETIME NOT NULL,
        INDEX idx_prompt_versions_pid (promptId)
      )
    `)
  } catch {
    return
  }
}

async function create(name: string, content: string) {
  const id = randomUUID()
  const pv: PromptVersion = { id: randomUUID(), promptId: id, version: 1, content, createdAt: new Date() }
  const p: Prompt = { id, name, activeVersion: 1 }
  try {
    const db = getMysql()
    await db.query("INSERT INTO prompts (id, name, activeVersion) VALUES (?,?,?)", [p.id, p.name, p.activeVersion])
    await db.query(
      "INSERT INTO prompt_versions (id, promptId, version, content, createdAt) VALUES (?,?,?,?,?)",
      [pv.id, pv.promptId, pv.version, pv.content, pv.createdAt]
    )
  } catch {
    // swallow
  }
  return p
}

async function addVersion(promptId: string, content: string) {
  const db = getMysql()
  const [rows] = await db.query("SELECT MAX(version) AS v FROM prompt_versions WHERE promptId = ?", [promptId])
  const max = Number(((rows as Array<{ v: number | null }>)[0]?.v) || 0)
  const v = max + 1
  const pv: PromptVersion = { id: randomUUID(), promptId, version: v, content, createdAt: new Date() }
  await db.query(
    "INSERT INTO prompt_versions (id, promptId, version, content, createdAt) VALUES (?,?,?,?,?)",
    [pv.id, pv.promptId, pv.version, pv.content, pv.createdAt]
  )
  await db.query("UPDATE prompts SET activeVersion = ? WHERE id = ?", [v, promptId])
  return pv
}

async function getActiveContent(promptId: string) {
  const db = getMysql()
  const [pr] = await db.query("SELECT activeVersion FROM prompts WHERE id = ? LIMIT 1", [promptId])
  const activeVersion = Number(((pr as Array<{ activeVersion: number }>)[0]?.activeVersion) || 0)
  if (!activeVersion) throw new Error("Prompt not found")
  const [rows] = await db.query("SELECT content FROM prompt_versions WHERE promptId = ? AND version = ? LIMIT 1", [promptId, activeVersion])
  const pv = (rows as Array<{ content: string }>)[0]
  if (!pv) throw new Error("Active version not found")
  return pv.content
}

async function listPrompts() {
  try {
    const db = getMysql()
    const [rows] = await db.query("SELECT id, name, activeVersion FROM prompts ORDER BY name ASC")
    return rows as Prompt[]
  } catch {
    return []
  }
}

async function listVersions(promptId: string) {
  try {
    const db = getMysql()
    const [rows] = await db.query(
      "SELECT id, promptId, version, content, createdAt FROM prompt_versions WHERE promptId = ? ORDER BY version ASC",
      [promptId]
    )
    return rows as PromptVersion[]
  } catch {
    return []
  }
}

async function removeAll() {
  try {
    const db = getMysql()
    await db.query("DELETE FROM prompt_versions")
    await db.query("DELETE FROM prompts")
  } catch {
    return
  }
}

const promptEngine = {
  render(content: string, vars: Record<string, unknown>) {
    return content.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => {
      const v = (vars as Record<string, unknown>)[k]
      return v === undefined ? "" : String(v)
    })
  }
}

export const promptService = { init, create, addVersion, getActiveContent, listPrompts, listVersions, removeAll }
export { promptEngine }

import { createDecipheriv, createCipheriv, randomBytes } from "crypto"
import { getMysql } from "../db/mysql.js"
import { config } from "../config/index.js"

const algo = "aes-256-gcm"
function getKey() {
  const key = Buffer.from((process.env.SECRET_STORE_KEY || config.jwtSecret).padEnd(32, "0")).subarray(0, 32)
  return key
}

function encrypt(text: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(algo, getKey(), iv)
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64")}:${enc.toString("base64")}:${tag.toString("base64")}`
}

function decrypt(blob: string) {
  const [ivB64, encB64, tagB64] = blob.split(":")
  const iv = Buffer.from(ivB64, "base64")
  const enc = Buffer.from(encB64, "base64")
  const tag = Buffer.from(tagB64, "base64")
  const decipher = createDecipheriv(algo, getKey(), iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(enc), decipher.final()])
  return dec.toString("utf-8")
}

async function init() {
  try {
    const db = getMysql()
    await db.query(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(64) UNIQUE,
        value_enc TEXT,
        createdAt DATETIME,
        updatedAt DATETIME
      )
    `)
  } catch {
    return
  }
}

async function upsert(name: string, value: string) {
  try {
    const db = getMysql()
    const now = new Date()
    const blob = encrypt(value)
    await db.query(
      "INSERT INTO api_keys (name, value_enc, createdAt, updatedAt) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE value_enc=VALUES(value_enc), updatedAt=VALUES(updatedAt)",
      [name, blob, now, now]
    )
  } catch {
    return
  }
}

async function list() {
  try {
    const db = getMysql()
    const [rows] = await db.query("SELECT name, value_enc, createdAt, updatedAt FROM api_keys ORDER BY name ASC")
    const out = (rows as Array<{ name: string; value_enc: string; createdAt: Date; updatedAt: Date }>).map((r) => {
      let preview = ""
      try {
        const v = decrypt(r.value_enc)
        preview = v.length <= 4 ? v : `****${v.slice(-4)}`
      } catch {
        const v = r.value_enc || ""
        preview = v.length <= 4 ? v : `****${v.slice(-4)}`
      }
      return { name: r.name, preview, createdAt: r.createdAt, updatedAt: r.updatedAt }
    })
    return out
  } catch {
    return []
  }
}

async function remove(name: string) {
  try {
    const db = getMysql()
    await db.query("DELETE FROM api_keys WHERE name = ?", [name])
  } catch {
    return
  }
}

async function get(name: string) {
  try {
    const db = getMysql()
    const [rows] = await db.query("SELECT value_enc FROM api_keys WHERE name = ? LIMIT 1", [name])
    const r = (rows as Array<{ value_enc: string }>)[0]
    if (!r) {
      console.log(`⚠️[SecretService] Key not found: ${name}`)
      return ""
    }
    try {
      const val = decrypt(r.value_enc)
      return val
    } catch (err) {
      console.log(`⚠️[SecretService] Decrypt failed for ${name}, returning raw value`)
      return r.value_enc || ""
    }
  } catch (err) {
    console.error(`💥[SecretService] Error getting key ${name}:`, err)
    return ""
  }
}

export const secretService = { init, upsert, list, remove, get }

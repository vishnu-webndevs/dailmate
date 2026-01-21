import { randomUUID } from "crypto"
import bcrypt from "bcryptjs"
import { FastifyInstance } from "fastify"
import { User, Role } from "../models/user.js"
import { getMysql } from "../db/mysql.js"
import { RowDataPacket } from "mysql2"
import "@fastify/jwt"

async function init() {
  const db = getMysql()
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      email VARCHAR(128) NOT NULL UNIQUE,
      passwordHash VARCHAR(255) NOT NULL,
      role VARCHAR(16) NOT NULL DEFAULT 'agent',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

async function register({ email, password, role }: { email: string; password: string; role?: string }) {
  const db = getMysql()
  
  // Check if user exists
  const [rows] = await db.query<RowDataPacket[]>("SELECT * FROM users WHERE email = ?", [email])
  if (rows.length > 0) {
     // If it's the admin user, we might want to ensure they have the correct password if we were enforcing state,
     // but for now, if they exist, we just return the existing user to avoid "User exists" error on restart.
     // However, the original code threw "User exists".
     // But for the bootstrap admin user, we should probably handle it gracefully.
     if (email === "admin@example.com") {
        return rows[0] as User
     }
     throw new Error("User exists")
  }

  const hash = await bcrypt.hash(password, 10)
  const r: Role = role === "admin" || role === "supervisor" || role === "agent" ? (role as Role) : "agent"
  
  // Check if this is the first user
  const [countRows] = await db.query<RowDataPacket[]>("SELECT COUNT(*) as count FROM users")
  const isFirst = countRows[0].count === 0
  const finalRole = isFirst ? "admin" : r

  const user: User = { id: randomUUID(), email, passwordHash: hash, role: finalRole }
  
  await db.query(
    "INSERT INTO users (id, email, passwordHash, role) VALUES (?, ?, ?, ?)",
    [user.id, user.email, user.passwordHash, user.role]
  )
  
  return user
}

async function login({ email, password }: { email: string; password: string }) {
  const db = getMysql()
  const [rows] = await db.query<RowDataPacket[]>("SELECT * FROM users WHERE email = ?", [email])
  const user = rows[0] as User | undefined
  
  if (!user) throw new Error("Invalid credentials")
  
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) throw new Error("Invalid credentials")
  
  return user
}

async function issueTokens(app: FastifyInstance, user: User) {
  const access = await app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: "12h" })
  const refresh = await app.jwt.sign({ sub: user.id }, { expiresIn: "7d" })
  return { access_token: access, refresh_token: refresh }
}

async function getById(id: string) {
  const db = getMysql()
  const [rows] = await db.query<RowDataPacket[]>("SELECT * FROM users WHERE id = ?", [id])
  return rows[0] as User | undefined
}

export const authService = { init, register, login, issueTokens, getById }

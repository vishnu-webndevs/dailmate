import { randomUUID } from "crypto"
import bcrypt from "bcryptjs"
import { FastifyInstance } from "fastify"
import { User, Role } from "../models/user.js"
import "@fastify/jwt"

const users = new Map<string, User>()
const byId = new Map<string, User>()

async function register({ email, password, role }: { email: string; password: string; role?: string }) {
  if (users.has(email)) throw new Error("User exists")
  const hash = await bcrypt.hash(password, 10)
  const r: Role = role === "admin" || role === "supervisor" || role === "agent" ? (role as Role) : "agent"
  const user: User = { id: randomUUID(), email, passwordHash: hash, role: users.size === 0 ? "admin" : r }
  users.set(email, user)
  byId.set(user.id, user)
  return user
}

async function login({ email, password }: { email: string; password: string }) {
  const user = users.get(email)
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

function getById(id: string) {
  return byId.get(id)
}

export const authService = { register, login, issueTokens, getById }

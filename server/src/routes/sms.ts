import { FastifyPluginAsync } from "fastify"
import "@fastify/jwt"
import fetch from "node-fetch"
import { getMysql } from "../db/mysql.js"

function canSend(req: unknown) {
  const u = (req as { user?: { role?: string } }).user
  return !!u && ["admin", "supervisor"].includes(u.role || "")
}

const plugin: FastifyPluginAsync = async (app) => {
  app.post("/send", { preHandler: async (req) => { await req.jwtVerify() } }, async (req, reply) => {
    if (!canSend(req)) {
      reply.code(403).send({ error: "forbidden" })
      return
    }
    const body = req.body as { to: string; text: string }
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_FROM
    if (!sid || !token || !from) {
      reply.code(400).send({ error: "twilio_not_configured" })
      return
    }
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
    const params = new URLSearchParams({ From: from, To: body.to, Body: body.text })
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    })
    const ok = res.ok
    try {
      const db = getMysql()
      await db.query("CREATE TABLE IF NOT EXISTS sms (id INT AUTO_INCREMENT PRIMARY KEY, `to` VARCHAR(64), `from` VARCHAR(64), text TEXT, status VARCHAR(16), createdAt DATETIME)")
      await db.query("INSERT INTO sms (`to`, `from`, text, status, createdAt) VALUES (?,?,?,?,?)", [body.to, from, body.text, ok ? "sent" : "error", new Date()])
    } catch {
      // noop
    }
    reply.send({ ok })
  })
  app.get("/history", { preHandler: async (req) => { await req.jwtVerify() } }, async () => {
    try {
      const db = getMysql()
      const [rows] = await db.query("SELECT id, `to`, `from`, text, status, createdAt FROM sms ORDER BY createdAt DESC LIMIT 200")
      return rows
    } catch {
      return []
    }
  })
}

export default plugin

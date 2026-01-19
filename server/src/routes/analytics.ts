import { FastifyPluginAsync } from "fastify"
import "@fastify/jwt"
import { getMysql } from "../db/mysql.js"
import { callService } from "../services/callService.js"

const plugin: FastifyPluginAsync = async (app) => {
  app.get("/overview", { preHandler: async (req) => { await req.jwtVerify() } }, async () => {
    try {
      const db = getMysql()
      const [rows] = await db.query("SELECT status, COUNT(*) as c FROM calls GROUP BY status")
      const stats: Record<string, number> = {}
      for (const r of rows as Array<{ status: string; c: number }>) {
        stats[r.status] = r.c
      }
      const live = callService.live().length
      const [smsRows] = await db.query("SELECT COUNT(*) as c FROM sms")
      const smsCount = (smsRows as Array<{ c: number }>)[0]?.c || 0
      return { calls: stats, live, sms: smsCount }
    } catch {
      return { calls: {}, live: callService.live().length, sms: 0 }
    }
  })
}

export default plugin

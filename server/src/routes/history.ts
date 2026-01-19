import { FastifyPluginAsync } from "fastify"
import { getMysql } from "../db/mysql.js"
import { getMongo } from "../db/mongo.js"
import "@fastify/jwt"

const plugin: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: async (req) => { await req.jwtVerify() } }, async () => {
    try {
      const db = getMysql()
      const [rows] = await db.query("SELECT id, `from`, `to`, status, startedAt, endedAt, recordingUrl FROM calls ORDER BY startedAt DESC LIMIT 200")
      return rows
    } catch {
      return []
    }
  })
  app.get("/:id/transcript", { preHandler: async (req) => { await req.jwtVerify() } }, async (req, reply) => {
    const id = (req.params as { id: string }).id
    try {
      const mongo = await getMongo()
      const docs = await mongo.collection("transcripts").find({ callId: id }).sort({ ts: 1 }).toArray()
      reply.send(docs)
    } catch {
      reply.send([])
    }
  })
}

export default plugin

import { FastifyPluginAsync } from "fastify"
import { testConnection } from "../db/mysql.js"

const plugin: FastifyPluginAsync = async (app) => {
  app.get("/health", async (req, reply) => {
    // Quick check: 1 attempt, 100ms timeout
    const db = await testConnection(1, 100)
    if (!db) {
      reply.code(503)
      return { ok: false, db }
    }
    return { ok: true, db }
  })
}

export default plugin

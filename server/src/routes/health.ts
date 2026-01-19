import { FastifyPluginAsync } from "fastify"
import { testConnection } from "../db/mysql.js"

const plugin: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => {
    const db = await testConnection()
    return { ok: true, db }
  })
}

export default plugin

import { FastifyPluginAsync } from "fastify"

const plugin: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => ({ ok: true }))
}

export default plugin

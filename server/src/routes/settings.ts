import { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import "@fastify/jwt"
import { secretService } from "../services/secretService.js"
import { agentService } from "../services/agentService.js"
import { promptService } from "../services/promptService.js"

function isAdmin(req: unknown) {
  const u = (req as { user?: { role?: string } }).user
  return !!u && u.role === "admin"
}

const plugin: FastifyPluginAsync = async (app) => {
  app.get("/api-keys", { preHandler: async (req) => { await req.jwtVerify() } }, async (req, reply) => {
    if (!isAdmin(req)) {
      reply.code(403).send({ error: "forbidden" })
      return
    }
    const rows = await secretService.list()
    reply.send(rows)
  })
  app.post("/api-keys", { preHandler: async (req) => { await req.jwtVerify() } }, async (req, reply) => {
    if (!isAdmin(req)) {
      reply.code(403).send({ error: "forbidden" })
      return
    }
    const body = z.object({ name: z.string().min(2), value: z.string().min(1) }).parse(req.body)
    await secretService.upsert(body.name, body.value)
    reply.code(201).send({ ok: true })
  })
  app.delete("/api-keys/:name", { preHandler: async (req) => { await req.jwtVerify() } }, async (req, reply) => {
    if (!isAdmin(req)) {
      reply.code(403).send({ error: "forbidden" })
      return
    }
    const name = (req.params as { name: string }).name
    if (!name || name.length < 2) {
      reply.code(400).send({ error: "invalid_name" })
      return
    }
    await secretService.remove(name)
    reply.code(204).send()
  })

  app.post("/wipe-agents-prompts", { preHandler: async (req) => { await req.jwtVerify() } }, async (req, reply) => {
    if (!isAdmin(req)) {
      reply.code(403).send({ error: "forbidden" })
      return
    }
    await agentService.removeAll()
    await promptService.removeAll()
    reply.send({ ok: true })
  })
}

export default plugin

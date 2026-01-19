import { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import "@fastify/jwt"
import { agentService } from "../services/agentService.js"

const schema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  promptId: z.string().optional(),
  twilioFrom: z.string().optional(),
  voice: z.string().optional(),
  language: z.enum(["en", "hi"])
})

const plugin: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: async (req) => { await req.jwtVerify() } }, async () => {
    return await agentService.list()
  })
  app.post("/", { preHandler: async (req) => { await req.jwtVerify() } }, async (req, reply) => {
    const body = schema.parse(req.body)
    const agent = await agentService.create(body)
    reply.code(201).send(agent)
  })
  app.put("/:id", { preHandler: async (req) => { await req.jwtVerify() } }, async (req, reply) => {
    const id = Number((req.params as { id: string }).id)
    const body = schema.partial().parse(req.body)
    const agent = await agentService.update(id, body)
    if (!agent) {
      reply.code(404).send({ error: "not_found" })
      return
    }
    reply.send(agent)
  })
}

export default plugin

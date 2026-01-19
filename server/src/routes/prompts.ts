import { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { promptService } from "../services/promptService.js"
import "@fastify/jwt"

const createSchema = z.object({
  name: z.string().min(1),
  content: z.string().min(1)
})

const plugin: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: async (req) => { await req.jwtVerify() } }, async () => {
    return await promptService.listPrompts()
  })
  app.get("/:id/versions", { preHandler: async (req) => { await req.jwtVerify() } }, async (req) => {
    const id = (req.params as { id: string }).id
    return await promptService.listVersions(id)
  })
  app.post("/:id/versions", { preHandler: async (req) => { await req.jwtVerify() } }, async (req, reply) => {
    const id = (req.params as { id: string }).id
    const body = z.object({ content: z.string().min(1) }).parse(req.body)
    const pv = await promptService.addVersion(id, body.content)
    reply.code(201).send(pv)
  })
  app.post("/", { preHandler: async (req) => { await req.jwtVerify() } }, async (req, reply) => {
    const body = createSchema.parse(req.body)
    const p = await promptService.create(body.name, body.content)
    reply.code(201).send(p)
  })
}

export default plugin

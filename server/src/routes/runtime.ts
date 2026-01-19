import { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { createRuntime } from "../runtime/index.js"
import { promptEngine, promptService } from "../services/promptService.js"
import "@fastify/jwt"
import { LocalRuntime } from "../runtime/LocalRuntime.js"

const schema = z.object({
  prompt_id: z.string(),
  input: z.string(),
  variables: z.record(z.string()).optional()
})

const plugin: FastifyPluginAsync = async (app) => {
  app.post("/chat", { preHandler: async (req) => { await req.jwtVerify() } }, async (req, reply) => {
    const body = schema.parse(req.body)
    const content = await promptService.getActiveContent(body.prompt_id)
    const rendered = promptEngine.render(content, body.variables || {})
    const runtime: LocalRuntime = createRuntime()
    const res = await runtime.chat(`${rendered}\n\nUser: ${body.input}`, { prompt_id: body.prompt_id })
    reply.send(res)
  })
}

export default plugin

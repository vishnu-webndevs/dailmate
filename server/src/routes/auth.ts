import { FastifyPluginAsync } from "fastify"
import { z } from "zod"
import { authService } from "../services/authService.js"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().optional()
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

const plugin: FastifyPluginAsync = async (app) => {
  app.post("/register", async (req, reply) => {
    const body = registerSchema.parse(req.body)
    const user = await authService.register(body)
    const tokens = await authService.issueTokens(app, user)
    reply.send(tokens)
  })

  app.post("/login", async (req, reply) => {
    const body = loginSchema.parse(req.body)
    const user = await authService.login(body)
    const tokens = await authService.issueTokens(app, user)
    reply.send(tokens)
  })
  app.post("/refresh", async (req, reply) => {
    try {
      const body = (req.body || {}) as { refresh_token?: string }
      const token = body.refresh_token || ""
      const decoded = await app.jwt.verify(token)
      const userId = (decoded as { sub?: string }).sub
      if (!userId) {
        reply.code(401).send({ error: "invalid_refresh" })
        return
      }
      const user = await authService.getById(userId)
      if (!user) {
        reply.code(401).send({ error: "invalid_refresh" })
        return
      }
      const tokens = await authService.issueTokens(app, user)
      reply.send(tokens)
    } catch {
      reply.code(401).send({ error: "invalid_refresh" })
    }
  })
}

export default plugin

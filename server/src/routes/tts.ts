import { FastifyPluginAsync } from "fastify"
import "@fastify/jwt"
import fetch from "node-fetch"
import { secretService } from "../services/secretService.js"

const plugin: FastifyPluginAsync = async (app) => {
  app.get("/voices", { preHandler: async (req) => { await req.jwtVerify() } }, async (_req, reply) => {
    const apiKey = process.env.ELEVENLABS_API_KEY || await secretService.get("ELEVENLABS_API_KEY") || ""
    if (!apiKey) {
      reply.send([])
      return
    }
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey }
    })
    if (!res.ok) {
      reply.send([])
      return
    }
    const data = await res.json() as unknown as { voices?: Array<{ voice_id: string; name: string; category?: string }> }
    const out = (data.voices || []).map(v => ({ id: v.voice_id, name: v.name, category: v.category || "" }))
    reply.send(out)
  })
}

export default plugin

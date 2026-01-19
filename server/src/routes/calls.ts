import { FastifyPluginAsync } from "fastify"
import { callService } from "../services/callService.js"
import { TwilioAdapter } from "../telephony/twilio/TwilioAdapter.js"
import "@fastify/jwt"

const plugin: FastifyPluginAsync = async (app) => {
  const adapter = new TwilioAdapter()
  app.get("/live", { preHandler: async (req) => { await req.jwtVerify() } }, async () => {
    return callService.live()
  })
  app.post("/:id/hangup", { preHandler: async (req) => { await req.jwtVerify() } }, async (req, reply) => {
    const id = (req.params as { id: string }).id
    app.log.info({ callId: id }, "⌛[TwilioController] Hangup request")
    const ok = await adapter.hangup(id)
    await callService.update(id, { status: "ended", endedAt: new Date() })
    app.log.info({ callId: id, ok }, "⌛[TwilioController] Hangup complete")
    reply.send({ ok })
  })
}

export default plugin

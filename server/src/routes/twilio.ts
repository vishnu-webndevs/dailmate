import { FastifyPluginAsync } from "fastify"
import { TwilioAdapter } from "../telephony/twilio/TwilioAdapter.js"
import { z } from "zod"
import { agentService } from "../services/agentService.js"
import { config } from "../config/index.js"
import { callService } from "../services/callService.js"
import "@fastify/jwt"

const outboundSchema = z.object({
  to: z.string().min(5),
  agent_id: z.union([z.string(), z.number()]),
  prompt_id: z.string().optional()
})

const plugin: FastifyPluginAsync = async (app) => {
  const adapter = new TwilioAdapter()
  app.post("/inbound", async (req, reply) => {
    const mediaUrl = config.mediaStreamUrl
    const xml = adapter.inboundTwiml(mediaUrl)
    app.log.info({ mediaUrl }, "⌛[TwilioController] Inbound served")
    reply.header("Content-Type", "text/xml").send(xml)
  })
  
  app.post("/status", async (req, reply) => {
    const body = req.body as { CallSid: string; CallStatus: string; CallDuration?: string }
    const { CallSid, CallStatus } = body
    
    app.log.info({ CallSid, CallStatus }, "⌛[TwilioController] Status Callback")
    
    if (["completed", "failed", "busy", "no-answer", "canceled"].includes(CallStatus)) {
      await callService.update(CallSid, { status: "ended", endedAt: new Date() })
      app.log.info({ CallSid, status: "ended" }, "⌛[TwilioController] Call marked as ended via callback")
    } else if (CallStatus === "in-progress") {
      // Optional: mark as live if not already
      // await callService.update(CallSid, { status: "live" })
    }
    
    reply.send({ ok: true })
  })

  app.get("/numbers", { preHandler: async (req) => { await req.jwtVerify() } }, async (_req, reply) => {
    const list = await adapter.listNumbers()
    app.log.info({ count: list.length }, "⌛[TwilioController] Numbers list")
    reply.send(list)
  })
  app.post("/outbound", { preHandler: async (req) => { await req.jwtVerify() } }, async (req, reply) => {
    const body = outboundSchema.parse(req.body)
    const agentId = typeof body.agent_id === "string" ? Number(body.agent_id) : body.agent_id
    const agent = Number.isFinite(agentId) ? await agentService.getById(agentId as number) : undefined
    const promptId = body.prompt_id || agent?.promptId || "default"
    app.log.info({ to: body.to, agentId, from: agent?.twilioFrom, promptId }, "⌛[TwilioController] Outbound request")
    const res = await adapter.outbound({ to: body.to, agentId: body.agent_id, promptId, from: agent?.twilioFrom })
    if (!res.queued) {
      app.log.info({ to: body.to }, "❗[TwilioController] Outbound error")
      reply.code(400).send({ error: "twilio_not_configured" })
      return
    }
    app.log.info({ sid: res.sid, to: body.to }, "⌛[TwilioController] Outbound queued")
    reply.send({ queued: true, sid: res.sid })
  })
}

export default plugin

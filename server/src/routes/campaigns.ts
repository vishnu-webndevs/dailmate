import { FastifyPluginAsync } from "fastify"
import { TwilioAdapter } from "../telephony/twilio/TwilioAdapter.js"
import "@fastify/jwt"

function hasRole(req: unknown, roles: string[]) {
  const u = (req as { user?: { role?: string } }).user
  return !!u && !!u.role && roles.includes(u.role)
}

const plugin: FastifyPluginAsync = async (app) => {
  const adapter = new TwilioAdapter()
  app.post("/batch-call", {
    preHandler: async (req) => { await req.jwtVerify() }
  }, async (req, reply) => {
    if (!hasRole(req, ["admin", "supervisor"])) {
      reply.code(403).send({ error: "forbidden" })
      return
    }
    const mp = (req as unknown as { files?: Array<{ fieldname: string; toBuffer: () => Promise<Buffer> }> }).files || []
    const file = Array.isArray(mp) ? mp.find((f) => f.fieldname === "file") : undefined
    if (!file) {
      reply.code(400).send({ error: "file_required" })
      return
    }
    const buf = await file.toBuffer()
    const csv = buf.toString("utf-8")
    const lines = csv.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean)
    let queued = 0
    for (const line of lines) {
      const [phone] = line.split(",")
      if (!phone) continue
      const res = await adapter.outbound({ to: phone, agentId: "batch", promptId: "default" })
      if (res.queued) queued++
    }
    reply.send({ total: lines.length, queued })
  })
}

export default plugin

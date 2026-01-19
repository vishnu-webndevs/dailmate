import { randomUUID } from "crypto"
import { FastifyInstance } from "fastify"

export function registerRequestId(app: FastifyInstance) {
  app.decorateRequest("requestId", "")
  app.addHook("onRequest", async (req) => {
    const idHeader = req.headers["x-request-id"]
    const id = typeof idHeader === "string" ? idHeader : randomUUID()
    req.requestId = id
  })
}

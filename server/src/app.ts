import Fastify from "fastify"
import cors from "@fastify/cors"
import jwt from "@fastify/jwt"
import formbody from "@fastify/formbody"
import multipart from "@fastify/multipart"
import websocket from "@fastify/websocket"
import { config } from "./config/index.js"
import { registerRequestId } from "./utils/requestId.js"
import healthRoutes from "./routes/health.js"
import authRoutes from "./routes/auth.js"
import agentRoutes from "./routes/agents.js"
import promptRoutes from "./routes/prompts.js"
import runtimeRoutes from "./routes/runtime.js"
import twilioRoutes from "./routes/twilio.js"
import callsRoutes from "./routes/calls.js"
import campaignsRoutes from "./routes/campaigns.js"
import historyRoutes from "./routes/history.js"
import smsRoutes from "./routes/sms.js"
import analyticsRoutes from "./routes/analytics.js"
import mediaController from "./controllers/mediaStream.js"
import settingsRoutes from "./routes/settings.js"
import ttsRoutes from "./routes/tts.js"
import debugRoutes from "./routes/debug.js"
import { secretService } from "./services/secretService.js"
import { agentService } from "./services/agentService.js"
import { promptService } from "./services/promptService.js"
import { callService } from "./services/callService.js"

export function buildApp() {
  const app = Fastify({
    logger: {
      level: "info",
      transport: { target: "pino-pretty" }
    }
  })
  void secretService.init()
  void agentService.init()
  void promptService.init()
  void callService.init()
  app.register(cors, {
    origin: true,
    methods: ["GET","POST","PUT","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"],
    preflightContinue: false
  })
  app.register(formbody)
  app.register(multipart)
  app.register(websocket)
  app.register(jwt, { secret: config.jwtSecret })
  registerRequestId(app)
  app.register(healthRoutes)
  app.register(authRoutes, { prefix: "/auth" })
  app.register(agentRoutes, { prefix: "/agents" })
  app.register(promptRoutes, { prefix: "/prompts" })
  app.register(runtimeRoutes, { prefix: "/runtime" })
  app.register(twilioRoutes, { prefix: "/twilio" })
  app.register(callsRoutes, { prefix: "/calls" })
  app.register(campaignsRoutes, { prefix: "/campaigns" })
  app.register(historyRoutes, { prefix: "/history" })
  app.register(smsRoutes, { prefix: "/sms" })
  app.register(analyticsRoutes, { prefix: "/analytics" })
  app.register(settingsRoutes, { prefix: "/settings" })
  app.register(ttsRoutes, { prefix: "/tts" })
  app.register(debugRoutes, { prefix: "/debug" })
  app.register(mediaController)
  return app
}

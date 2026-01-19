import dotenv from "dotenv"

dotenv.config()

const defaultPort = Number(process.env.PORT || 8000)
const defaultPublicUrl = process.env.PUBLIC_URL || `http://localhost:${defaultPort}`

function bool(v: string | undefined, def = false) {
  if (v === undefined) return def
  return v === "true" || v === "1"
}

function deriveWsUrlFromHttp(base: string) {
  const clean = base.replace(/\/+$/, "")
  if (clean.startsWith("https://")) return `wss://${clean.slice("https://".length)}`
  if (clean.startsWith("http://")) return `ws://${clean.slice("http://".length)}`
  return `wss://${clean}`
}

export const config = {
  port: defaultPort,
  jwtSecret: process.env.JWT_SECRET || "changeme",
  publicUrl: defaultPublicUrl,
  mediaStreamUrl: process.env.MEDIA_STREAM_URL || deriveWsUrlFromHttp(defaultPublicUrl),
  logMediaFrames: bool(process.env.LOG_MEDIA_FRAMES),
  logMediaMarks: bool(process.env.LOG_MEDIA_MARKS),
  logTtsFrames: bool(process.env.LOG_TTS_FRAMES),
  logSttEvents: bool(process.env.LOG_STT_EVENTS),
  mysql: {
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "wnd-ai"
  },
  mongo: {
    uri: process.env.MONGO_URI || "mongodb://localhost:27017",
    db: process.env.MONGO_DB || "wndai"
  },
  aiProvider: process.env.AI_PROVIDER || "mock",
  forceHindi: bool(process.env.FORCE_HINDI)
}

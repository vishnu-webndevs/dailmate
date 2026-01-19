import { FastifyPluginAsync } from "fastify"
import fs from "fs"
import path from "path"

const debugRoutes: FastifyPluginAsync = async (app) => {
  const debugDir = path.join(process.cwd(), "debug")

  app.get("/files", async (request) => {
    try {
      if (!fs.existsSync(debugDir)) {
        return []
      }
      const files = fs.readdirSync(debugDir)
        .filter(f => f.endsWith(".mp3"))
        .sort((a, b) => {
           // Sort by timestamp descending (tts_123_desc.ext)
           const tA = Number(a.split("_")[1]) || 0
           const tB = Number(b.split("_")[1]) || 0
           return tB - tA
        })
        .map(f => ({
          name: f,
          url: `${request.protocol}://${request.hostname}/debug/files/${f}`,
          ts: new Date(Number(f.split("_")[1]) || 0).toISOString()
        }))
      return files
    } catch (err) {
      request.log.error(err)
      return []
    }
  })

  app.get("/files/:filename", async (request, reply) => {
    const { filename } = request.params as { filename: string }
    const safeName = path.basename(filename) // Prevent directory traversal
    const filePath = path.join(debugDir, safeName)
    
    if (!fs.existsSync(filePath)) {
      reply.status(404).send({ error: "File not found" })
      return
    }

    if (filename.endsWith(".mp3")) {
      reply.header("Content-Type", "audio/mpeg")
      return reply.send(fs.createReadStream(filePath))
    }

    reply.status(400).send({ error: "Unsupported file type" })
  })
}

export default debugRoutes

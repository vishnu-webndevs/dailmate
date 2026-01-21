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
        .map(f => {
          const filePath = path.join(debugDir, f)
          const stats = fs.statSync(filePath)
          return {
            name: f,
            url: `${request.protocol}://${request.hostname}/debug/files/${f}`,
            ts: stats.mtime.toISOString(),
            mtimeMs: stats.mtimeMs
          }
        })
        .sort((a, b) => b.mtimeMs - a.mtimeMs)
        .map(({ name, url, ts }) => ({ name, url, ts }))
      
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

import { buildApp } from "./app.js"
import { config } from "./config/index.js"
import { authService } from "./services/authService.js"
import { testConnection } from "./db/mysql.js"

const app = buildApp()

async function start() {
  const connected = await testConnection()
  if (!connected) {
    console.error("❗[Server] Could not connect to database, exiting...")
    process.exit(1)
  }

  await authService.init()
  void authService.register({ email: "admin@example.com", password: "secret", role: "admin" }).catch(() => {})
  
  try {
    await app.listen({ port: config.port, host: "0.0.0.0" })
    console.log(`✅[Server] Listening on port ${config.port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

void start()

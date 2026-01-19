import { buildApp } from "./app.js"
import { config } from "./config/index.js"
import { authService } from "./services/authService.js"
import { testConnection } from "./db/mysql.js"

const app = buildApp()
void testConnection()
void authService.register({ email: "admin@example.com", password: "secret", role: "admin" }).catch(() => {})
app.listen({ port: config.port, host: "0.0.0.0" }).catch(err => {
  app.log.error(err)
  process.exit(1)
})

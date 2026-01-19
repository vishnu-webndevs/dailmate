import { createPool, Pool } from "mysql2/promise"
import { config } from "../config/index.js"

let pool: Pool | null = null

export function getMysql() {
  if (!pool) {
    pool = createPool({
      host: config.mysql.host,
      port: config.mysql.port,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
      waitForConnections: true,
      connectionLimit: 10
    })
  }
  return pool
}

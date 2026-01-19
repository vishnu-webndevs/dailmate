import { MongoClient, Db } from "mongodb"
import { config } from "../config/index.js"

let client: MongoClient | null = null
let db: Db | null = null

export async function getMongo() {
  if (!client) {
    client = new MongoClient(config.mongo.uri)
    await client.connect()
    db = client.db(config.mongo.db)
  }
  return db as Db
}

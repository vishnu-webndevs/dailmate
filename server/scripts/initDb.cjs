const mysql = require("mysql2/promise");

async function main() {
  try {
    const conn = await mysql.createConnection({
      host: "localhost",
      port: 3306,
      user: "root",
      password: ""
    });
    await conn.query("CREATE DATABASE IF NOT EXISTS `wnd-ai`");
    console.log("Database `wnd-ai` created/verified successfully.");
    await conn.end();
  } catch (err) {
    console.error("Error creating database:", err);
  }
}

main();

module.exports = {
  apps: [
    {
      name: "wnd-ai-server",
      script: "dist/server.js",
      instances: 1,
      exec_mode: "fork"
    }
  ]
}

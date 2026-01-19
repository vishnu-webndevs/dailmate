const WebSocket = require('ws')

const url = process.env.TEST_WSS_URL || 'wss://b1a5bbfb4f9d.ngrok-free.app/media-stream'
const streamSid = 'test-' + Date.now()
const ws = new WebSocket(url)

ws.on('open', () => {
  console.log('OPEN', url)
  ws.send(JSON.stringify({ event: 'connected', protocol: 'WebSocket', version: '0.2' }))
  ws.send(JSON.stringify({
    event: 'start',
    start: {
      streamSid,
      callSid: 'call-' + Date.now(),
      accountSid: 'ACtest',
      tracks: ['inbound', 'outbound'],
      mediaFormat: { encoding: 'mulaw', sampleRate: 8000, channels: 1 }
    }
  }))
})

ws.on('message', (d) => {
  try {
    console.log('MSG', d.toString())
  } catch {
    console.log('MSG', String(d))
  }
})

ws.on('error', (e) => {
  console.log('ERROR', (e && e.message) ? e.message : String(e))
})

ws.on('close', () => {
  console.log('CLOSE')
})

setTimeout(() => {
  try { ws.close() } catch {}
}, 4000)


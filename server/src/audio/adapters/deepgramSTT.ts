import WebSocket from "ws"

type WsLike = {
  on(event: "open", listener: () => void): void
  on(event: "message", listener: (data: Buffer | string) => void): void
  on(event: "close", listener: () => void): void
  on(event: "error", listener: () => void): void
  send(data: Buffer): void
  removeAllListeners(): void
  close(): void
}
import { STTProvider } from "../STTProvider.js"
import { secretService } from "../../services/secretService.js"
import { config } from "../../config/index.js"

type DGMessage = {
  channel?: { alternatives?: Array<{ transcript?: string; confidence?: number }> }
  is_final?: boolean
}

export class DeepgramSTT implements STTProvider {
  private ws: WsLike | null = null
  private ready = false
  private connecting: Promise<void> | null = null
  private lastText: string | null = null
  private closedLogged = false

  private async getApiKey() {
    const fromDb = await secretService.get("DEEPGRAM_API_KEY")
    return process.env.DEEPGRAM_API_KEY || fromDb || ""
  }

  private async connect(sampleRate: number) {
    if (this.ready && this.ws) return
    if (this.connecting) return this.connecting
    const apiKey = await this.getApiKey()
    if (!apiKey) {
      this.connecting = Promise.resolve()
      return
    }
    const sr = sampleRate || 8000
    const params = new URLSearchParams({
      model: "nova-2-general",
      encoding: "mulaw",
      sample_rate: String(sr),
      channels: "1",
      interim_results: "true",
      vad_events: "true"
    })
    const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`
    this.connecting = new Promise<void>((resolve) => {
      this.ws = new WebSocket(url, {
        headers: { Authorization: `Token ${apiKey}`, "User-Agent": `wnd-ai/${config.publicUrl}` }
      })
      const w = this.ws as WsLike
      w.on("open", () => {
        this.ready = true
        this.closedLogged = false
        if (config.logSttEvents) console.log("⌛[DeepgramSTT] Connection open")
        resolve()
      })
      w.on("message", (data: Buffer | string) => {
        try {
          const txt = typeof data === "string" ? data : data.toString("utf-8")
          const msg = JSON.parse(txt) as DGMessage
          const alt = msg?.channel?.alternatives?.[0]
          const t = alt?.transcript || ""
          if (config.logSttEvents) {
            if (t && t.trim()) {
              if (msg.is_final) {
                console.log("⌛[DeepgramSTT] Final Transcript", { transcript: t })
              } else {
                console.log("⌛[DeepgramSTT] Interim Transcript", { transcript: t })
              }
            }
          }
          // Only capture final transcripts to prevent AI from responding to partial sentences (self-interruption)
          if (msg.is_final && t && t.trim()) {
            this.lastText = t
          }
        } catch {
          return
        }
      })
      w.on("close", () => {
        this.ready = false
        this.ws = null
        this.connecting = null
        if (!this.closedLogged && config.logSttEvents) {
          console.log("⌛[DeepgramSTT] Connection closed")
          this.closedLogged = true
        } else {
          this.closedLogged = true
        }
      })
      w.on("error", () => {
        this.ready = false
        if (config.logSttEvents) console.log("❗[DeepgramSTT] Connection error")
      })
    })
    await this.connecting
  }

  async transcribe(chunk: Buffer, sampleRate: number): Promise<string | null> {
    await this.connect(sampleRate)
    if (this.ws && this.ready) {
      try {
        const w = this.ws as WsLike
        w.send(chunk)
        if (config.logSttEvents) console.log("⌛[DeepgramSTT] Audio chunk sent")
      } catch {
        // ignore send errors
      }
    }
    const t = this.lastText
    this.lastText = null
    return t || null
  }

  disconnect() {
    this.ready = false
    this.connecting = null
    if (this.ws) {
      this.ws.removeAllListeners()
      this.ws.close()
      this.ws = null
    }
  }
}

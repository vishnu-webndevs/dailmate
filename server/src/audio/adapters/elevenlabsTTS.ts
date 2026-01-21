import fetch from "node-fetch"
import { TTSProvider } from "../TTSProvider.js"
import { secretService } from "../../services/secretService.js"

type ElevenLanguage = "en" | "hi"

export class ElevenLabsTTS implements TTSProvider {
  constructor(private voiceId?: string, private lang: ElevenLanguage = "en") {}
  private async getApiKey() {
    const fromDb = await secretService.get("ELEVENLABS_API_KEY")
    return process.env.ELEVENLABS_API_KEY || fromDb || ""
  }
  async synthesize(text: string): Promise<string> {
    const apiKey = await this.getApiKey()
    if (!apiKey) return ""
    const globalKey = this.lang === "hi" ? "ELEVENLABS_VOICE_ID_HI" : "ELEVENLABS_VOICE_ID"
    let v = this.voiceId || (await secretService.get(globalKey)) || (await secretService.get("ELEVENLABS_VOICE_ID")) || ""
    if (!v) {
      console.log("⚠️[ElevenLabsTTS] No voice id configured, using default")
      v = "21m00Tcm4TlvDq8ikWAM" // Default to Rachel
    }

    console.log("[ElevenLabsTTS] Using voice id", v, "lang", this.lang)
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(v)}/stream?output_format=ulaw_8000`

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
        model_id: "eleven_turbo_v2"
      })
    })
    if (!res.ok) {
      console.log("❗[ElevenLabsTTS] API Error", res.status, await res.text())
      return ""
    }
    const raw = Buffer.from(await res.arrayBuffer())
    console.log("⌛[ElevenLabsTTS] Received audio bytes:", raw.length, "First 4 bytes:", raw.subarray(0, 4).toString("hex"))

    if (raw.length < 1) return ""

    let audio = raw
    if (audio.length > 44 && audio.subarray(0, 4).toString() === "RIFF") {
      console.log("⌛[ElevenLabsTTS] Stripping WAV header")
      audio = audio.subarray(44)
    }

    return audio.toString("base64")
  }
}

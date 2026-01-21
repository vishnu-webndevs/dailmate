import { FastifyPluginAsync } from "fastify"
import { callService } from "../services/callService.js"
import { MockSTT } from "../audio/adapters/mockSTT.js"
import { DeepgramSTT } from "../audio/adapters/deepgramSTT.js"
import { MockTTS } from "../audio/adapters/mockTTS.js"
import { ElevenLabsTTS } from "../audio/adapters/elevenlabsTTS.js"
import { createRuntime } from "../runtime/index.js"
import { secretService } from "../services/secretService.js"
import { agentService } from "../services/agentService.js"
import { promptService } from "../services/promptService.js"
import { config } from "../config/index.js"
import { detectScripts, expectedLanguageMismatch } from "../utils/language.js"
import { STTProvider } from "../audio/STTProvider.js"
import { TTSProvider } from "../audio/TTSProvider.js"

type WsLike = {
  on(event: "message", listener: (raw: string | Buffer) => void): void
  on(event: "close", listener: () => void): void
  on(event: "error", listener: (err: unknown) => void): void
  send(data: string): void
}

type TwilioMessage =
  | { event: "connected"; protocol?: string; version?: string }
  | { event: "start"; start: { streamSid: string; callSid: string; accountSid: string; tracks?: string[]; mediaFormat?: { encoding?: string; sampleRate?: number; channels?: number } } }
  | { event: "media"; streamSid: string; media: { payload: string; track?: string; chunk?: string; timestamp?: string } }
  | { event: "mark"; streamSid: string; mark: { name: string } }
  | { event: "stop"; streamSid: string }

const plugin: FastifyPluginAsync = async (app) => {
  await callService.init()
  const sockets = new Map<string, { send: (data: string) => void }>()
  const sessions = new Map<string, {
    stt: STTProvider;
    tts: TTSProvider;
    lastText?: string;
    runtime: ReturnType<typeof createRuntime>;
    seq: number;
    t0: number;
    inFrames: number;
    outFrames: number;
    outChunk: number;
    callId: string;
    agentId?: number;
    activeTimeouts: Set<NodeJS.Timeout>;
    agentName?: string;
    agentDescription?: string;
    language: "en" | "hi";
    promptId?: string;
    promptText?: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
  }>()
  const byCall = new Map<string, string>()
  const monitoringClients = new Map<number, Set<{ send: (data: string) => void }>>()

  function sendMonitor(agentId: number | undefined, payload: unknown) {
    if (agentId === undefined) return
    const set = monitoringClients.get(agentId)
    if (!set) return
    const msg = JSON.stringify(payload)
    for (const c of set) c.send(msg)
  }

  // Helper to stop current audio playback
  function stopAudio(streamSid: string) {
    const s = sessions.get(streamSid)
    if (!s) return
    
    // Clear all scheduled frames
    for (const t of s.activeTimeouts) {
      clearTimeout(t)
    }
    s.activeTimeouts.clear()

    // Send Twilio "clear" event to flush their buffer
    sockets.get(streamSid)?.send(JSON.stringify({
      event: "clear",
      streamSid
    }))
  }

  // Helper to stream audio to Twilio
  function streamAudio(streamSid: string, payloadBase64: string) {
    const s = sessions.get(streamSid)
    if (!s) return

    // 1. Stop any existing audio
    stopAudio(streamSid)

    const pcmu = Buffer.from(payloadBase64, "base64")
    const CHUNK = 160 // 20ms of 8kHz mu-law
    let c = 0

    for (let i = 0; i < pcmu.length; i += CHUNK) {
      const frame = pcmu.subarray(i, Math.min(i + CHUNK, pcmu.length))
      const delay = c * 20
      
      const t = setTimeout(() => {
        if (!sessions.has(streamSid)) return
        s.activeTimeouts.delete(t) // Cleanup self
        
        const payload = frame.toString("base64")
        const out = {
          event: "media",
          sequenceNumber: String(s.seq++),
          media: {
            track: "outbound",
            chunk: String(++s.outChunk),
            timestamp: String(Math.floor(Date.now() - s.t0)),
            payload
          },
          streamSid
        }
        sockets.get(streamSid)?.send(JSON.stringify(out))
        s.outFrames++
        sendMonitor(s.agentId, { type: "MONITOR_AUDIO_AI", agentId: s.agentId, audio: frame.toString("base64") })
      }, delay)
      
      s.activeTimeouts.add(t)
      c++
    }
    
    // Schedule EOS mark
    const tEOS = setTimeout(() => {
        if (!sessions.has(streamSid)) return
        s.activeTimeouts.delete(tEOS)
        const mark = { event: "mark", streamSid, mark: { name: "eos" } }
        sockets.get(streamSid)?.send(JSON.stringify(mark))
        app.log.info({ streamSid }, "⌛[WebSocketController] TTS playback finished (EOS)")
    }, c * 20)
    s.activeTimeouts.add(tEOS)
    
    if (config.logTtsFrames) app.log.info({ streamSid, frames: c }, "⌛[WebSocketController] TTS frames scheduled")
  }

  async function cleanupStream(streamSid: string) {
    const s = sessions.get(streamSid)
    if (!s) return

    app.log.info({ streamSid, inFrames: s.inFrames, outFrames: s.outFrames }, "⌛[WebSocketController] Stream cleanup")
    stopAudio(streamSid)
    if (s.stt.disconnect) s.stt.disconnect()
    
    sessions.delete(streamSid)
    sockets.delete(streamSid)
    
    if (s.callId) {
      byCall.delete(s.callId)
      await callService.update(s.callId, { status: "ended", endedAt: new Date() })
      app.log.info({ callSid: s.callId }, "⌛[WebSocketController] Call status ENDED (cleanup)")
    }
  }

  function computeQualityScore(text: string, latencyMs: number) {
    const wordCount = text.split(/\s+/).filter(Boolean).length
    const tooShort = wordCount < 3
    const tooLong = wordCount > 80
    const lengthScore = tooShort || tooLong ? 0.4 : 1
    const latencyScore = latencyMs <= 3000 ? 1 : latencyMs <= 6000 ? 0.6 : 0.2
    const punctuationScore = /[.!?]$/.test(text.trim()) ? 1 : 0.7
    const overall = Number(((lengthScore * 0.4) + (latencyScore * 0.4) + (punctuationScore * 0.2)).toFixed(2))
    return { overall, lengthScore, latencyScore, punctuationScore, wordCount }
  }

  function validateLanguageText(text: string, language: "en" | "hi", kind: "input" | "output", streamSid: string, agentId?: number) {
    const t = text.trim()
    if (!t) return
    const mismatch = expectedLanguageMismatch(language, t)
    if (mismatch) {
      const { hasDevanagari, hasLatin } = detectScripts(t)
      app.log.info({ streamSid, agentId, language, kind, hasDevanagari, hasLatin, sample: t.slice(0, 80) }, "❗[LanguageValidation] Expected language does not match text script")
    }
  }

  const handleConnection = (connection: { socket: unknown }) => {
    const ws = connection.socket as unknown as WsLike
    let currentStreamSid: string | undefined
    app.log.info("⌛[WebSocketController] New Connection Initiated")

    ws.on("close", () => {
      app.log.info({ streamSid: currentStreamSid }, "⌛[WebSocketController] WebSocket connection closed")
      if (currentStreamSid) {
        void cleanupStream(currentStreamSid)
      }
    })

    ws.on("error", (err) => {
      app.log.info({ err: String(err) }, "❗[WebSocketController] WebSocket connection error")
    })

    ws.on("message", async (raw: string | Buffer) => {
      let msg: TwilioMessage | null = null
      try {
        msg = JSON.parse(String(raw))
      } catch {
        app.log.info({ len: typeof raw === "string" ? raw.length : raw.byteLength }, "❗[WebSocketController] ws-message-parse-error")
        return
      }

      if (!msg) return

      try {
        if (msg.event === "connected") {
          const m = msg as { protocol?: string; version?: string }
          app.log.info({ protocol: m.protocol || "", version: m.version || "" }, "⌛[WebSocketController] Twilio Connected")
          return
        }

        if (msg.event === "start") {
          const id = msg.start.callSid
          currentStreamSid = msg.start.streamSid
          byCall.set(id, msg.start.streamSid)
          sockets.set(msg.start.streamSid, { send: (data: string) => ws.send(data) })
          app.log.info({ streamSid: msg.start.streamSid, callSid: id, tracks: msg.start.tracks || [], mediaFormat: msg.start.mediaFormat || {} }, "⌛[WebSocketController] Media Stream start")

          let tts: TTSProvider = new MockTTS()
          let stt: STTProvider = new MockSTT()
          let language: "en" | "hi" = "en"

          try {
            const apiKey = process.env.ELEVENLABS_API_KEY || await secretService.get("ELEVENLABS_API_KEY") || ""
            app.log.info({ streamSid: msg.start.streamSid, hasApiKey: !!apiKey }, "🔍[WebSocketController] Checking ElevenLabs API Key")
            
            const call = callService.get(id)
            if (call?.agentId !== undefined) {
              try {
                const agent = await agentService.getById(call.agentId)
                if (agent && agent.language) {
                  language = agent.language
                }
              } catch {
                void 0
              }
            }
            if (apiKey) {
              let voiceId = call?.voice || ""
              if (call?.agentId !== undefined) {
                try {
                  const agent = await agentService.getById(call.agentId)
                  if (agent && agent.voice) {
                    voiceId = agent.voice
                  }
                } catch {
                  void 0
                }
              }
              if (!voiceId) {
                voiceId = (await secretService.get("ELEVENLABS_VOICE_ID")) || ""
              }
              tts = new ElevenLabsTTS(voiceId || undefined, language)
              app.log.info({ streamSid: msg.start.streamSid, voiceId, language }, "⌛[WebSocketController] ElevenLabs voice selected")
            }

            const dgKey = process.env.DEEPGRAM_API_KEY || await secretService.get("DEEPGRAM_API_KEY") || ""
            if (dgKey) {
              stt = new DeepgramSTT()
            }
            app.log.info({ streamSid: msg.start.streamSid, stt: dgKey ? "deepgram" : "mock", tts: apiKey ? "elevenlabs" : "mock" }, "⌛[WebSocketController] Audio providers selected")
          } catch (err) {
            app.log.error({ err, stack: (err as Error).stack }, "❗[WebSocketController] Error selecting audio providers, falling back to MockTTS")
            tts = new MockTTS()
          }

          const rec = callService.get(id)
          let agentName: string | undefined
          let agentDescription: string | undefined
          let promptId: string | undefined
          let promptText: string | undefined

          if (rec?.agentId !== undefined) {
            try {
              const agent = await agentService.getById(rec.agentId)
              if (agent) {
                agentName = agent.name
                agentDescription = agent.description
                if (agent.promptId) {
                  promptId = agent.promptId
                }
              }
            } catch {
              agentName = undefined
              agentDescription = undefined
            }
          }

          if (!promptId && rec?.promptId) {
            promptId = rec.promptId
          }

          if (promptId) {
            try {
              promptText = await promptService.getActiveContent(promptId)
              app.log.info({ callId: id, promptId }, "⌛[WebSocketController] Loaded agent prompt context")
            } catch (err) {
              app.log.info({ callId: id, promptId, err: String(err) }, "❗[WebSocketController] Failed to load agent prompt context")
              promptText = undefined
            }
          }
          sessions.set(msg.start.streamSid, {
            stt,
            tts,
            runtime: createRuntime(),
            seq: 1,
            t0: Date.now(),
            inFrames: 0,
            outFrames: 0,
            outChunk: 0,
            callId: id,
            agentId: rec?.agentId,
            activeTimeouts: new Set(),
            agentName,
            agentDescription,
            language,
            promptId,
            promptText,
            history: []
          })
          await callService.upsert({ id, status: "live", startedAt: new Date() })
          app.log.info({ callSid: id }, "⌛[WebSocketController] Call status LIVE")

          try {
            const greetText = language === "hi"
              ? "नमस्ते, मैं आपका एआई सहायक हूँ। मैं आपकी किस तरह मदद कर सकता हूँ?"
              : "Hello, this is your AI agent. How can I help you today?"
            const greet = await tts.synthesize(greetText)
            let greetPayload = greet
            if (!greetPayload) {
              const fb = await new MockTTS().synthesize("beep")
              greetPayload = fb
              app.log.info({ streamSid: msg.start.streamSid }, "❗[WebSocketController] TTS fallback greeting (mock)")
            }

            if (greetPayload) {
              streamAudio(msg.start.streamSid, greetPayload)
            }
          } catch {
            void 0
          }
          return
        }

        if (msg.event === "media") {
          const s = sessions.get(msg.streamSid)
          if (s) {
            const buf = Buffer.from(msg.media.payload, "base64")
            s.inFrames++
            if (config.logMediaFrames) app.log.info({ streamSid: msg.streamSid, track: msg.media.track || "", chunk: msg.media.chunk || "", ts: msg.media.timestamp || "" }, "⌛[WebSocketController] Media inbound")
            sendMonitor(s.agentId, { type: "MONITOR_AUDIO", agentId: s.agentId, audio: buf.toString("base64") })

            const text = await s.stt.transcribe(buf, 8000)
            if (text) {
              validateLanguageText(text, s.language, "input", msg.streamSid, s.agentId)
              app.log.info({ streamSid: msg.streamSid, transcript: text }, "⌛[WebSocketController] Final Transcript:🔵")
              app.log.info({ streamSid: msg.streamSid, customer_said: text }, "⌛[WebSocketController] Customer said")

              const currentCallId = Array.from(callService.live()).at(0)?.id || ""
              if (currentCallId) {
                void callService.addTranscript(currentCallId, "user", text)
              }
              sendMonitor(s.agentId, { type: "MONITOR_TRANSCRIPT", agentId: s.agentId, speaker: "user", transcript: text, timestamp: new Date().toISOString() })

              s.history.push({ role: "user", content: text })
              if (s.history.length > 16) s.history.splice(0, s.history.length - 16)

              const t0LlM = Date.now()
              const res = await s.runtime.chat(text, {
                callId: s.callId,
                agentId: s.agentId,
                agentName: s.agentName,
                agentDescription: s.agentDescription,
                history: s.history,
                locale: s.language === "hi" ? "hi-IN" : "en-IN",
                language: s.language,
                promptId: s.promptId,
                promptText: s.promptText
              })
              const llmLatencyMs = Date.now() - t0LlM
              if ("output" in res) {
                const outText = (res as unknown as { output: string }).output
                validateLanguageText(outText, s.language, "output", msg.streamSid, s.agentId)
                app.log.info({ streamSid: msg.streamSid, agent_output: outText }, "⌛[WebSocketController] LLM Output")
                
                void callService.addTranscript(s.callId, "assistant", outText)

                s.history.push({ role: "assistant", content: outText })
                if (s.history.length > 16) s.history.splice(0, s.history.length - 16)

                try {
                  const quality = computeQualityScore(outText, llmLatencyMs)
                  void callService.addMetric({
                    callId: s.callId,
                    streamSid: msg.streamSid,
                    agentId: s.agentId,
                    llmLatencyMs,
                    outputLength: outText.length,
                    quality: quality.overall
                  })
                  sendMonitor(s.agentId, { type: "QUALITY_SCORE", agentId: s.agentId, callId: s.callId, streamSid: msg.streamSid, quality, llmLatencyMs })
                } catch {
                  void 0
                }

                let responsePayload = ""
                if (s.language === "hi") {
                  try {
                    const primary = await s.tts.synthesize(outText)
                    responsePayload = primary
                  } catch (err) {
                    app.log.info({ streamSid: msg.streamSid, err: String(err) }, "❗[WebSocketController] Hindi TTS error")
                  }
                  if (!responsePayload) {
                    try {
                      const fallbackVoice = (await secretService.get("ELEVENLABS_EN_VOICE_ID")) || (await secretService.get("ELEVENLABS_VOICE_ID")) || ""
                      if (fallbackVoice) {
                        const fbTts = new ElevenLabsTTS(fallbackVoice)
                        const fbPayload = await fbTts.synthesize(outText)
                        if (fbPayload) {
                          responsePayload = fbPayload
                          app.log.info({ streamSid: msg.streamSid }, "⌛[WebSocketController] Hindi TTS fallback to English voice")
                        }
                      }
                    } catch (err) {
                      app.log.info({ streamSid: msg.streamSid, err: String(err) }, "❗[WebSocketController] Hindi TTS English fallback error")
                    }
                  }
                } else {
                  const payloadB64 = await s.tts.synthesize(outText)
                  responsePayload = payloadB64
                }
                if (!responsePayload) {
                  const fb = await new MockTTS().synthesize("beep")
                  responsePayload = fb
                  app.log.info({ streamSid: msg.streamSid, language: s.language }, "❗[WebSocketController] TTS fallback response (mock)")
                }

                if (responsePayload) {
                  streamAudio(msg.streamSid, responsePayload)
                }
              }
            }
          }
          return
        }

        if (msg.event === "mark") {
          if (config.logMediaMarks) app.log.info({ mark: msg.mark.name }, "⌛[WebSocketController] Media mark")
          return
        }

        if (msg.event === "stop") {
          const sid = msg.streamSid
          app.log.info({ streamSid: sid }, "⌛[WebSocketController] Call has ended, Stopping Media Stream")
          
          if (sid) {
            await cleanupStream(sid)
          } else {
            // Fallback: if no streamSid in stop message, try to find by callId (legacy/fallback)
             const id = Array.from(callService.live()).at(0)?.id
             if (id) {
               const foundSid = byCall.get(id)
               if (foundSid) await cleanupStream(foundSid)
               else await callService.update(id, { status: "ended", endedAt: new Date() })
             }
          }
          return
        }

        app.log.info({ event: (msg as { event: string }).event }, "❗[WebSocketController] Unknown event")
      } catch (err) {
        app.log.error({ err: String(err), event: (msg as { event: string }).event }, "❗[WebSocketController] ws-message-handler-error")
      }
    })
  }

  app.get("/", { websocket: true }, handleConnection)
  app.get("/media-stream", { websocket: true }, handleConnection)
}

export default plugin

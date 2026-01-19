Overview

- End-to-end AI dialer and contact center platform that runs real-time phone calls over Twilio Media Streams, transcribes with Deepgram, generates responses via LLMs, and streams speech back using ElevenLabs TTS.
- Supports inbound and outbound calls, Answering Machine Detection (AMD), agent management, monitoring/barge, SMS messaging, full call history, recordings, and transcript storage.
Goals

- Automate conversational calling with human-like latency and interruption handling.
- Provide agent tooling for campaigns, prompts, and batch calling.
- Persist complete call artifacts (recordings, transcripts) and operational metrics.
- Ensure robust web/API surfaces with authentication and observability.
Architecture

- Backend Node/Express service with Twilio Webhooks and WebSocket server.
- Real-time pipeline: Twilio Media Streams ↔ WebSocketController ↔ STT ↔ LLM ↔ TTS ↔ Twilio.
- Storage split: MySQL for call metadata/agents/prompts/SMS; MongoDB for transcripts.
- Frontend customer-portal with pages for agents, prompts, call history, and monitoring.
Call Flow

- Inbound route connects Twilio to WebSocket; call record is created and recording starts.
- Outbound route initiates call, connects media stream, and queues TTS responses.
- Media events are handled by WebSocketController, which forwards audio to STT and steers LLM/TTS response loop.
- References:
  - TwiML and routes: routes.js
  - Media event handling: WebSocketController.js
  - Call state and audio queue: CallService.js
STT/TTS

- STT uses Deepgram Live (nova-3-medical, mulaw 8k) with interim results and VAD.
- Any transcript or VAD speech_start immediately calls stopPlayingAudioAndClearAudioQueue to barge-in cleanly.
- TTS uses ElevenLabs streaming (ulaw_8000) with REST fallback; Deepgram TTS secondary fallback; frames paced at 20 ms per 160 bytes.
- References:
  - STT Service: DeepgramSTTService.js
  - TTS Service: ElevenLabsTTSService.js
LLM

- Grok LLM streaming completions with function-calling to switch campaign prompts, collect diagnosis, and manage conversation context.
- Dynamic prompt selection per call and Hindi response enforcement via environment toggle.
- Audio generation loop queues speech back into CallService through an external dependency hook.
- References:
  - Queue audio hook: GrokLLMService.js:L205-L213
  - LLM streaming and tools: GrokLLMService.js
  - Function calling: GrokFunctionCallingService.js
Agents & Prompts

- Agent CRUD with Twilio number assignment and prompt version linkage.
- Prompt content fetched and variables replaced using lead data (full_name, dates, phone, etc.).
- Outbound calling UI and batch auto-calling via CSV with progress tracking.
- References:
  - Agent logic: AgentService.js
  - Prompt service: PromptService.js
  - UI: AgentPage.js
AMD

- Outbound calls can enable Twilio AMD with configurable timeouts and thresholds.
- Async callbacks processed; non-human detections auto-hangup and DB status updates.
- UI toggles for AMD in single and batch calls; periodic status polling.
- References:
  - Twilio AMD: TwilioService.js
  - Agent AMD orchestration: AgentService.js
  - Routes: routes.js AMD
Monitoring & Barge

- Real-time monitoring clients receive transcript and audio streams for a selected agent’s live call.
- Admin barge audio can be injected; admin/user transcripts stored in call state.
- References:
  - Monitoring and barging: WebSocketController.js
SMS

- Send SMS via Twilio, with status callbacks, inbound/outbound webhook handling, and DB persistence.
- Paginated SMS history and single message details retrieval.
- References:
  - Messaging controller: SMSController.js
Recording & History

- Recording starts for inbound/outbound; callbacks update recording URL and duration in DB.
- History endpoint aggregates Calls with agent and prompt info; transcript retrieval via Mongo.
- UI includes call list, transcript toggle, and recording playback.
- References:
  - CallController: CallController.js
  - History UI: CallHistory.js
APIs

- Auth: login/register
- Calls: history, transcripts, recordings, live calls, hangup
- Agents: CRUD, Twilio numbers, make-call (with/without AMD)
- Prompts: CRUD, versions, chat with inbound prompt, clear chat
- SMS: send, history, webhook/status updates
- References: routes.js
Data & Storage

- MySQL: Calls, Agents, Prompt store, SMS messages; joins for enriched history views.
- Mongo: Transcript storage with role tagging and timing details.
- References:
  - Call repository: CallRepository.js
Security

- JWT authentication for protected REST APIs and monitoring WebSocket actions.
- Basic token validation and WebSocket gatekeeping for monitoring commands.
- References:
  - Auth middleware: routes.js authenticateToken
  - WebSocket AUTH: WebSocketController.js
Configuration

- Environment toggles for TTS voice, Hindi enforcement, background noise, server URLs.
- PM2 start script; ngrok/Nginx proxy compatibility for WebSocket URLs.
- References:
  - Package and scripts: package.json
  - Env access: routes.js getWsUrl
Frontend

- Agents page: manage agents, make calls, monitor live calls, batch auto-calls, AMD options.
- Call history: sorting, recording playback, transcript viewing.
- Prompt chat: provider choice (Grok/OpenAI/Meta), clear session.
- References:
  - UI components: AgentPage.js , CallHistory.js , PromptChat.js
Dependencies

- Twilio, @deepgram/sdk, elevenlabs via WS/REST, fluent-ffmpeg for mp3→mulaw transcode.
- Express, ws, ioredis/redis (optional), mongoose/mysql2/sequelize, openai, axios, pm2, nodemon.
Operational

- Logging across controllers/services; recording callbacks update DB; live calls via Twilio REST.
- Background audio playback when queue is empty; random chunk selection for realism.
- Robust frame scheduling and media mark signals for end-of-audio.
Extensibility

- Easy to add new TTS providers or STT models by implementing service interfaces.
- LLM function tools enable campaign-specific automations and dynamic prompt flow.
- RBAC and multi-tenant layering can be introduced at route and query levels.
Known Constraints

- Reliance on external APIs for STT/TTS/telephony can introduce latency and rate limits.
- Proper handling of PII and retention policies needed for compliance.
- Audio pacing and WebSocket backpressure require monitoring under high concurrency.
Roadmap

- Add observability dashboards and alerting for STT/TTS latency and call drop rates.
- Implement RBAC and stricter JWT rotation/secret management.
- Expand analytics: AMD accuracy, conversion funnels, agent performance, export pipelines.
- Harden CI/CD with tests, lint/type checks, environment validation, and safe deploys.
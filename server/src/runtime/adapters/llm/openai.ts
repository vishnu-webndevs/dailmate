import fetch from "node-fetch"
import { LLMProvider, LLMResult } from "./LLMProvider.js"
import { secretService } from "../../../services/secretService.js"

export class OpenAiLLM implements LLMProvider {
  private async getApiKey() {
    const fromDb = await secretService.get("OPENAI_API_KEY")
    return process.env.OPENAI_API_KEY || fromDb || ""
  }
  async generate(input: string, context?: Record<string, unknown>): Promise<LLMResult> {
    const key = await this.getApiKey()
    if (!key) return { type: "text", text: input }

    const history = Array.isArray(context?.history) ? (context?.history as Array<{ role: string; content: string }>) : []
    const agentName = typeof context?.agentName === "string" ? String(context?.agentName) : "AI Agent"
    const agentDescription = typeof context?.agentDescription === "string" ? String(context?.agentDescription) : ""
    const industry = typeof context?.industry === "string" ? String(context?.industry) : "customer service"
    const locale = typeof context?.locale === "string" ? String(context?.locale) : "en-IN"
    const promptText = typeof context?.promptText === "string" ? String(context?.promptText) : ""

    const enforceLanguage =
      (locale.startsWith("hi") || String(context?.language || "").toLowerCase() === "hi")
        ? (
          `Language Policy:\n` +
          `- Always respond in fluent Hindi using Devanagari script.\n` +
          `- Do not switch to English except for unavoidable brand names or technical abbreviations.\n`
        )
        : (
          `Language Policy:\n` +
          `- Respond in natural, fluent English.\n`
        )

    const promptSection = promptText ? `Agent Prompt Context:\n${promptText}\n` : ""

    const systemPrompt =
      `You are ${agentName}, a friendly and human-like customer representative speaking on a live phone call.\n` +
      (agentDescription ? `Persona & Role: ${agentDescription}\n` : "") +
      `Industry: ${industry}.\n` +
      `Locale: ${locale}.\n` +
      enforceLanguage +
      (promptSection ? promptSection : "") +
      `Voice Conversation Guidelines (Crucial for sounding 100% human):\n` +
      `- Speak naturally like a real person on the phone. Use warm, expressive, conversational phrasing.\n` +
      `- Keep every response VERY CONCISE (1 to 2 short sentences, maximum 25 words). Long responses sound robotic on phone calls.\n` +
      `- Use natural conversational acknowledgments at the beginning of turns when appropriate (e.g. "Ji bilkul", "Achha samjha", "Sure thing", "Got it", "Haan bilkul").\n` +
      `- Never output bullet points, numbered lists, markdown, emojis, or special characters. Speak plain natural sentences.\n` +
      `- Show active empathy and listening before giving answers.\n` +
      `- Ask one brief follow-up question at the end to keep the phone conversation flowing naturally.\n` +
      `- Do not request sensitive credentials (passwords, OTPs, full credit cards).\n`

    const trimmedHistory = history.slice(-8)

    const url = "https://api.openai.com/v1/chat/completions"
    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...trimmedHistory.map((m) => ({ role: m.role === "assistant" ? "assistant" as const : "user" as const, content: m.content })),
        { role: "user", content: input }
      ],
      temperature: 0.6,
      frequency_penalty: 0.2,
      presence_penalty: 0.1,
      max_tokens: 200
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      return { type: "text", text: input }
    }
    const data = await res.json() as unknown as { choices?: Array<{ message?: { content?: string } }> }
    const text = data.choices?.[0]?.message?.content || ""
    return { type: "text", text: text || input }
  }
}

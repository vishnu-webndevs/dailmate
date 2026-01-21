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
      `You are ${agentName}, an AI voice agent speaking on a live phone call.\n` +
      (agentDescription ? `Persona: ${agentDescription}\n` : "") +
      `Industry: ${industry}.\n` +
      `Locale: ${locale}. Use natural, fluent language that matches this locale.\n` +
      enforceLanguage +
      (promptSection ? promptSection : "") +
      `Goals:\n` +
      `- Sound natural, warm, and human-like while staying efficient.\n` +
      `- Show emotional intelligence and empathy. Acknowledge feelings before solving problems.\n` +
      `- Use clear, polite, and professional language.\n` +
      `- Use industry-appropriate terminology, but avoid jargon the caller may not understand.\n` +
      `- Keep responses concise (1–3 sentences) unless more detail is explicitly requested.\n` +
      `- Ask one clear follow-up question at the end when appropriate to move the conversation forward.\n` +
      `Tone & Sentiment:\n` +
      `- If the caller is frustrated or upset, apologize briefly and reassure them you will help.\n` +
      `- If the caller is calm, keep a neutral and friendly tone.\n` +
      `- Never be sarcastic or dismissive.\n` +
      `Compliance & Safety:\n` +
      `- You are an automated AI system. Do not claim to be a human.\n` +
      `- If asked directly, clearly state you are an AI voice agent.\n` +
      `- Do not request or store extremely sensitive data (full credit card numbers, CVV, passwords, OTPs).\n` +
      `- If the caller tries to share such data, stop them and explain that for security reasons you cannot process it.\n` +
      `- Be culturally sensitive and avoid assumptions about religion, politics, gender, or ethnicity.\n` +
      `- For medical, legal, or financial advice, give only general guidance and recommend speaking to a qualified professional.\n` +
      `Style:\n` +
      `- Speak in short, well-structured sentences suitable for text-to-speech.\n` +
      `- Avoid spelling out URLs or long codes unless absolutely necessary.\n` +
      `- Do not include emojis.\n`

    const trimmedHistory = history.slice(-8)

    const tools = [
      {
        type: "function",
        function: {
          name: "end_call",
          description: "End the call when the user says goodbye, wants to hang up, or the conversation is finished.",
          parameters: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "The final message to speak before hanging up. For Hindi users, use 'आपका कीमती समय देने के लिए धन्यवाद' (Thank you for your valuable time) or similar polite closing."
              }
            },
            required: ["message"]
          }
        }
      }
    ]

    const url = "https://api.openai.com/v1/chat/completions"
    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...trimmedHistory.map((m) => ({ role: m.role === "assistant" ? "assistant" as const : "user" as const, content: m.content })),
        { role: "user", content: input }
      ],
      tools,
      tool_choice: "auto",
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
    const data = await res.json() as unknown as { choices?: Array<{ finish_reason?: string; message?: { content?: string; tool_calls?: Array<{ function: { name: string; arguments: string } }> } }> }
    
    const choice = data.choices?.[0]
    if (choice?.finish_reason === "tool_calls" && choice.message?.tool_calls) {
      const toolCall = choice.message.tool_calls.find(tc => tc.function.name === "end_call")
      if (toolCall) {
         try {
           return {
             type: "function_call",
             call: {
               name: "end_call",
               arguments: JSON.parse(toolCall.function.arguments)
             }
           }
         } catch {
           // fallback to text if parsing fails
         }
      }
    }

    const text = choice?.message?.content || ""
    return { type: "text", text: text || input }
  }
}

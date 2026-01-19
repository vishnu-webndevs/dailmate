import { LLMProvider, LLMResult } from "./LLMProvider.js"

export class MockLLM implements LLMProvider {
  async generate(input: string): Promise<LLMResult> {
    const t = input.toLowerCase()
    if (t.includes("switch")) {
      return { type: "function_call", call: { name: "switch_prompt", arguments: { to_version: "latest" } } }
    }
    return { type: "text", text: `Echo: ${input}` }
  }
}

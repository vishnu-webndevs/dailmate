import { LLMProvider } from "./adapters/llm/LLMProvider.js"
import { config } from "../config/index.js"

export class LocalRuntime {
  constructor(private llm: LLMProvider) {}
  async chat(input: string, state: Record<string, unknown>) {
    const res = await this.llm.generate(input, state)
    if (res.type === "text") {
      if (config.forceHindi) {
        return { output: `नमस्ते: ${res.text}` }
      }
      return { output: res.text }
    }
    return { function_call: res.call }
  }
}

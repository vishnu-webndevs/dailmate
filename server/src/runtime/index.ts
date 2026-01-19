import { LocalRuntime } from "./LocalRuntime.js"
import { OpenAiLLM } from "./adapters/llm/openai.js"

export function createRuntime() {
  const llm = new OpenAiLLM()
  return new LocalRuntime(llm)
}

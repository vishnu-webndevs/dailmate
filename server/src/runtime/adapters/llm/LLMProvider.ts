export type FunctionCall = { name: string; arguments: Record<string, unknown> }

export type LLMResult =
  | { type: "text"; text: string }
  | { type: "function_call"; call: FunctionCall }

export interface LLMProvider {
  generate(input: string, context?: Record<string, unknown>): Promise<LLMResult>
}

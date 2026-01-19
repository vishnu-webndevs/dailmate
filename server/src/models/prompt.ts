export interface Prompt {
  id: string
  name: string
  activeVersion: number
}

export interface PromptVersion {
  id: string
  promptId: string
  version: number
  content: string
  createdAt: Date
}

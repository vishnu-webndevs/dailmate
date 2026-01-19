import { STTProvider } from "../STTProvider.js"

export class MockSTT implements STTProvider {
  private used = false
  async transcribe(_chunk: Buffer, _sampleRate: number): Promise<string | null> {
    void _chunk
    void _sampleRate
    if (this.used) return null
    this.used = true
    return "Hello"
  }
}

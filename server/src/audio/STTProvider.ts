export interface STTProvider {
  transcribe(chunk: Buffer, sampleRate: number): Promise<string | null>
  disconnect?(): void
}

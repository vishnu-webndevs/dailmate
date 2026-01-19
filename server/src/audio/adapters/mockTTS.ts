import { TTSProvider } from "../TTSProvider.js"

export class MockTTS implements TTSProvider {
  async synthesize(_text: string): Promise<string> {
    void _text
    // Generate a robust 400Hz Square Wave for testing.
    // This avoids complex math and guarantees valid Mu-law bytes.
    // Mu-law silence is 0xFF. 
    // We will alternate between two audible values to create a clear tone.
    
    const sampleRate = 8000
    const duration = 1.0 // 1 second
    const numSamples = Math.floor(sampleRate * duration)
    const out = Buffer.alloc(numSamples)
    
    // 400Hz @ 8000Hz = 20 samples per cycle.
    // 10 samples HIGH, 10 samples LOW.
    // 0x80 is +Max, 0x00 is -Max in Mu-law (approximately).
    // We'll use 0x9A (positive) and 0x1A (negative) for a pleasant beep.
    
    const HIGH = 0x9A
    const LOW = 0x1A
    const PERIOD = 20
    const HALF_PERIOD = 10

    for (let i = 0; i < numSamples; i++) {
      const phase = i % PERIOD
      out[i] = phase < HALF_PERIOD ? HIGH : LOW
    }

    return out.toString("base64")
  }
}

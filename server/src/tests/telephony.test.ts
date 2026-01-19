import test from "node:test"
import assert from "node:assert/strict"
import { TwilioAdapter } from "../telephony/twilio/TwilioAdapter.js"

test("twilio inbound twiml contains Connect Stream", async () => {
  const t = new TwilioAdapter()
  const xml = t.inboundTwiml("ws://localhost:3000/media-stream")
  assert.equal(xml.includes("<Connect>"), true)
  assert.equal(xml.includes("<Stream"), true)
})

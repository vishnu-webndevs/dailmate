import test from "node:test"
import assert from "node:assert/strict"
import { createRuntime } from "../runtime/index.js"

test("runtime echoes text", async () => {
  const rt = createRuntime()
  const res = await rt.chat("Hello", {})
  if ("output" in res) {
    const outText = (res as unknown as { output: string }).output
    assert.equal(outText.includes("Hello"), true)
    return
  }
  assert.fail("expected text output")
})

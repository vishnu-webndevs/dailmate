import test from "node:test"
import assert from "node:assert/strict"
import { detectScripts, expectedLanguageMismatch } from "../utils/language.js"

test("detectScripts identifies Devanagari and Latin", () => {
  const hindi = "नमस्ते दुनिया"
  const english = "hello world"
  const mixed = "नमस्ते world"

  const d1 = detectScripts(hindi)
  assert.equal(d1.hasDevanagari, true)
  assert.equal(d1.hasLatin, false)

  const d2 = detectScripts(english)
  assert.equal(d2.hasDevanagari, false)
  assert.equal(d2.hasLatin, true)

  const d3 = detectScripts(mixed)
  assert.equal(d3.hasDevanagari, true)
  assert.equal(d3.hasLatin, true)
})

test("expectedLanguageMismatch flags Hindi inputs that are Latin", () => {
  assert.equal(expectedLanguageMismatch("hi", "hello"), true)
  assert.equal(expectedLanguageMismatch("hi", "नमस्ते"), false)
})

test("expectedLanguageMismatch flags English outputs that contain Devanagari", () => {
  assert.equal(expectedLanguageMismatch("en", "नमस्ते"), true)
  assert.equal(expectedLanguageMismatch("en", "hello"), false)
})

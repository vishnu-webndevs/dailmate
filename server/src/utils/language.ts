export function detectScripts(text: string): { hasDevanagari: boolean; hasLatin: boolean } {
  const t = (text || "").trim()
  if (!t) return { hasDevanagari: false, hasLatin: false }
  const hasDevanagari = /[\u0900-\u097F]/.test(t)
  const hasLatin = /[A-Za-z]/.test(t)
  return { hasDevanagari, hasLatin }
}

export function expectedLanguageMismatch(language: "en" | "hi", text: string): boolean {
  const { hasDevanagari, hasLatin } = detectScripts(text)
  if (language === "hi") {
    return !hasDevanagari && hasLatin
  }
  return hasDevanagari
}

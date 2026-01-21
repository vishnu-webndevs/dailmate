import { TelephonyAdapter, OutboundRequest } from "../TelephonyAdapter.js"
import fetch from "node-fetch"
import { config } from "../../config/index.js"
import { secretService } from "../../services/secretService.js"
import { callService } from "../../services/callService.js"
import { agentService } from "../../services/agentService.js"

export class TwilioAdapter implements TelephonyAdapter {
  inboundTwiml(mediaUrl: string, params?: { from?: string; to?: string }): string {
    const url = new URL(mediaUrl)
    if (params?.from) url.searchParams.set("from", params.from)
    if (params?.to) url.searchParams.set("to", params.to)
    const s = url.toString()
    console.log("⌛[TwilioAdapter] Inbound TwiML generated", { mediaUrl: s })
    return `<?xml version="1.0" encoding="UTF-8"?><Response><Connect><Stream url="${s}"/></Connect><Pause length="1"/></Response>`
  }
  private async creds() {
    const sid = process.env.TWILIO_ACCOUNT_SID || await secretService.get("TWILIO_ACCOUNT_SID")
    const token = process.env.TWILIO_AUTH_TOKEN || await secretService.get("TWILIO_AUTH_TOKEN")
    const from = process.env.TWILIO_FROM || await secretService.get("TWILIO_FROM")
    if (!sid || !token) {
      console.log("❗[TwilioAdapter] Missing Twilio credentials")
    }
    return { sid, token, from }
  }
  async outbound(req: OutboundRequest): Promise<{ queued: boolean; sid?: string }> {
    const { sid, token, from: globalFrom } = await this.creds()
    const from = req.from || globalFrom
    if (!sid || !token || !from) return { queued: false }
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`
    const body = new URLSearchParams({
      From: from,
      To: req.to,
      Twiml: this.inboundTwiml(config.mediaStreamUrl, { from, to: req.to }),
      StatusCallback: `${config.publicUrl}/api/twilio/status`,
      StatusCallbackEvent: "initiated ringing answered completed",
      StatusCallbackMethod: "POST"
    })
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    })
    if (!res.ok) {
      console.log("❗[TwilioAdapter] Outbound call failed", { to: req.to, status: res.status })
      return { queued: false }
    }
    const data = await res.json() as unknown as { sid?: string }
    if (data.sid) {
      const agent = typeof req.agentId === "number" ? await agentService.getById(req.agentId) : undefined
      await callService.upsert({
        id: data.sid,
        from,
        to: req.to,
        agentId: typeof req.agentId === "number" ? req.agentId : undefined,
        voice: agent?.voice,
        promptId: req.promptId,
        status: "starting",
        startedAt: new Date()
      })
      console.log("⌛[TwilioAdapter] Outbound queued", { sid: data.sid, to: req.to, from })
    }
    return { queued: true, sid: data.sid }
  }
  async hangup(callId: string): Promise<boolean> {
    try {
      const { sid, token } = await this.creds()
      if (!sid || !token) return false
      const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls/${callId}.json`
      const body = new URLSearchParams({ Status: "completed" })
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body
      })
      console.log("⌛[TwilioAdapter] Hangup requested", { callId, ok: res.ok })
      return res.ok
    } catch (err) {
      console.error("❗[TwilioAdapter] Hangup failed", { callId, err })
      return false
    }
  }
  async listNumbers(): Promise<Array<{ phoneNumber: string; friendlyName?: string }>> {
    const { sid, token } = await this.creds()
    if (!sid || !token) {
      const fb = await this.fallbackNumbers()
      return fb
    }
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json`
    const res = await fetch(url, {
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64")
      }
    })
    if (!res.ok) {
      const fb = await this.fallbackNumbers()
      return fb
    }
    const data = await res.json() as unknown as { incoming_phone_numbers?: Array<{ phone_number: string; friendly_name?: string }> }
    const list = (data.incoming_phone_numbers || []).map((n) => ({ phoneNumber: n.phone_number, friendlyName: n.friendly_name }))
    const fb = await this.fallbackNumbers()
    const merged = [...list, ...fb].filter((v, i, arr) => arr.findIndex(x => x.phoneNumber === v.phoneNumber) === i)
    console.log("⌛[TwilioAdapter] Numbers fetched", { count: merged.length })
    return merged
  }
  private async fallbackNumbers(): Promise<Array<{ phoneNumber: string; friendlyName?: string }>> {
    const out: Array<{ phoneNumber: string; friendlyName?: string }> = []
    const { from } = await this.creds()
    const envPhone = process.env.TWILIO_PHONE_NUMBER || await secretService.get("TWILIO_PHONE_NUMBER")
    const candidates = [from, envPhone].filter((v): v is string => !!v)
    for (const c of candidates) out.push({ phoneNumber: c })
    return out
  }
}

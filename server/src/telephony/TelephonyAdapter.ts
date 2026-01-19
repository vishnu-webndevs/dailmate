export interface OutboundRequest {
  to: string
  agentId: string | number
  promptId: string
  from?: string
}

export interface TelephonyAdapter {
  inboundTwiml(mediaUrl: string): string
  outbound(req: OutboundRequest): Promise<{ queued: boolean; sid?: string }>
  hangup(callId: string): Promise<boolean>
}

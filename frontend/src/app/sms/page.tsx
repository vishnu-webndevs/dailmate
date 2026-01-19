'use client'
import { useState } from "react";

export default function SMS() {
  const [to, setTo] = useState("")
  const [text, setText] = useState("")
  const [status, setStatus] = useState<string>("")
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem("jwt") || ""
    const res = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to, text })
    })
    const data = await res.json()
    setStatus(JSON.stringify(data))
  }
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Send SMS</h1>
      <form className="mt-4 flex flex-col gap-2" onSubmit={onSubmit}>
        <input className="border p-2" value={to} onChange={e => setTo(e.target.value)} placeholder="+15551234567" />
        <textarea className="border p-2" value={text} onChange={e => setText(e.target.value)} placeholder="Message"></textarea>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Send</button>
      </form>
      <p className="mt-4 break-all">{status}</p>
    </main>
  )
}

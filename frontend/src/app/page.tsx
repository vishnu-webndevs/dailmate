'use client'
import { useEffect, useState } from "react";

export default function Home() {
  const [health, setHealth] = useState<string>("")
  useEffect(() => {
    fetch("/api/health")
      .then(r => r.json())
      .then(d => setHealth(JSON.stringify(d)))
      .catch(() => setHealth("unavailable"))
  }, [])
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">WND-AI Frontend</h1>
      <p className="mt-2">Backend health: {health}</p>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <a href="/calls" className="underline text-blue-600">View Live Calls</a>
        <a href="/login" className="underline text-blue-600">Login</a>
        <a href="/history" className="underline text-blue-600">History</a>
        <a href="/analytics" className="underline text-blue-600">Analytics</a>
        <a href="/sms" className="underline text-blue-600">SMS</a>
        <a href="/campaigns" className="underline text-blue-600">Batch Call</a>
      </div>
    </main>
  );
}

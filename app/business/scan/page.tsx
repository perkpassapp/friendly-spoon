'use client'
import { useState } from 'react'

export default function BusinessScan() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<'valid' | 'invalid' | null>(null)
  const [loading, setLoading] = useState(false)

  async function verifyCode() {
    setLoading(true)
    // Simulate verification — in production this hits your API
    await new Promise(r => setTimeout(r, 800))
    // Codes starting with PP- are valid for demo
    setResult(code.startsWith('PP-') && code.length >= 8 ? 'valid' : 'invalid')
    setLoading(false)
  }

  function reset() {
    setCode('')
    setResult(null)
  }

  if (result === 'valid') return (
    <main className="min-h-screen bg-green-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-8xl mb-6">✅</div>
        <h2 className="text-white text-3xl font-black mb-3">Valid!</h2>
        <p className="text-green-300 text-lg mb-2">Code: <strong>{code}</strong></p>
        <p className="text-green-400 mb-10">Apply the discount now.</p>
        <button onClick={reset} className="w-full bg-white text-black font-bold py-4 rounded-xl text-lg">
          Scan Next Code
        </button>
      </div>
    </main>
  )

  if (result === 'invalid') return (
    <main className="min-h-screen bg-red-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-8xl mb-6">❌</div>
        <h2 className="text-white text-3xl font-black mb-3">Invalid Code</h2>
        <p className="text-red-300 mb-10">This code is expired or already used.</p>
        <button onClick={reset} className="w-full bg-white text-black font-bold py-4 rounded-xl text-lg">
          Try Again
        </button>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white">
            Perk<span className="text-amber-400">Pass</span>
          </h1>
          <p className="text-gray-400 mt-2">Business verification</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-4">
          <p className="text-gray-400 text-sm mb-3">Enter member code manually</p>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="PP-XXXXXX"
            className="w-full bg-black text-white border border-gray-700 rounded-xl px-4 py-4 text-2xl font-mono tracking-widest text-center focus:outline-none focus:border-amber-400 uppercase"
            maxLength={9}
          />
        </div>

        <button
          onClick={verifyCode}
          disabled={loading || code.length < 8}
          className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold py-4 rounded-xl text-lg mb-4 transition-all"
        >
          {loading ? 'Checking...' : '✓ Verify Code'}
        </button>

        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <p className="text-gray-400 text-sm text-center">
            💡 Ask the member to show their QR code or read their code aloud
          </p>
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-gray-600 text-sm">← Back to home</a>
        </div>
      </div>
    </main>
  )
}
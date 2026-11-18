import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

const WIDE_PROMPTS = [
  'What should I focus on today?',
  'Explain my #1 skill gap',
  'Explain FastAPI dependency injection',
  'How do Docker containers work?',
  'What is RAG in Generative AI?',
  'Give me a Python interview question',
  'How do indexes speed up SQL queries?',
]

export default function MentorChatCard() {
  const { idToken, currentUser } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState(() => {
    try {
      const saved = sessionStorage.getItem('sf_initial_prompt')
      if (saved) {
        sessionStorage.removeItem('sf_initial_prompt')
        return saved
      }
    } catch {}
    return ''
  })
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusInfo, setStatusInfo] = useState({ has_gemini_key: false, provider: 'Google Gemini AI' })
  const [keyModalOpen, setKeyModalOpen] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [savingKey, setSavingKey] = useState(false)
  const [keySuccessMsg, setKeySuccessMsg] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchStatus = useCallback(async () => {
    if (!idToken) return
    try {
      const res = await fetch('/api/mentor/status', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStatusInfo(data)
      }
    } catch (err) {
      console.error('Failed to fetch mentor status:', err)
    }
  }, [idToken])

  const fetchHistory = useCallback(async () => {
    if (!idToken) return
    try {
      setInitialLoading(true)
      const res = await fetch('/api/mentor/history', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.error('Failed to fetch mentor history:', err)
    } finally {
      setInitialLoading(false)
    }
  }, [idToken])

  useEffect(() => {
    if (idToken) {
      fetchStatus()
      fetchHistory()
    }
  }, [idToken, fetchStatus, fetchHistory])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || input).trim()
    if (!text || !idToken || loading) return

    setInput('')
    setError('')
    const optimisticUserMsg = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticUserMsg])
    setLoading(true)

    try {
      const res = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Failed to send message')
      }

      const data = await res.json()
      const newModelMsg = {
        role: 'model',
        content: data.reply,
        timestamp: data.timestamp,
      }
      setMessages((prev) => [...prev, newModelMsg])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveApiKey = async (e) => {
    e.preventDefault()
    if (!apiKeyInput.trim() || !idToken) return

    try {
      setSavingKey(true)
      setError('')
      const res = await fetch('/api/mentor/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ api_key: apiKeyInput.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to save API key')

      setKeySuccessMsg('✓ Google Gemini API key activated successfully!')
      fetchStatus()
      setTimeout(() => {
        setKeyModalOpen(false)
        setKeySuccessMsg('')
        setApiKeyInput('')
      }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingKey(false)
    }
  }

  const handleClearHistory = async () => {
    if (!idToken || !confirm('Clear all mentor conversation history?')) return
    try {
      await fetch('/api/mentor/history', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      })
      setMessages([])
    } catch (err) {
      console.error('Failed to clear history:', err)
    }
  }

  // Helper to render markdown-like content with styled code blocks
  const renderMessageContent = (content) => {
    const parts = content.split(/(```[\s\S]*?```)/g)
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n')
        const language = lines[0].match(/^[a-zA-Z0-9_-]+$/) ? lines[0] : ''
        const code = language ? lines.slice(1).join('\n') : lines.join('\n')

        return (
          <div key={i} className="my-2.5 rounded-xl overflow-hidden border border-[#30363d] bg-[#0d1117] text-slate-100 font-mono text-[11px]">
            <div className="flex items-center justify-between px-3 py-1 bg-white/[0.04] border-b border-[#30363d]/60 text-[10px] text-slate-400">
              <span>{language || 'code'}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(code)}
                className="hover:text-white transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="p-3 overflow-x-auto scrollbar-thin">
              <code>{code}</code>
            </pre>
          </div>
        )
      }

      return (
        <span key={i} className="whitespace-pre-wrap">
          {part}
        </span>
      )
    })
  }

  if (!currentUser) return null

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 text-slate-100 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#30363d]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              SkillForge AI Technical Mentor
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              Google AI Powered
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ask wide-ranging questions about software engineering, coding problems, architecture, frameworks, and your verified career gaps.
          </p>
        </div>

        {/* Engine Status & Config */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setKeyModalOpen(true)}
            className={`text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              statusInfo.has_gemini_key
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
            title="Configure Google Gemini API Key"
          >
            <span>{statusInfo.has_gemini_key ? '✨' : '🔑'}</span>
            <span>{statusInfo.has_gemini_key ? 'Gemini 1.5 Active' : 'Add Gemini Key'}</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl bg-white/5 border border-[#30363d] hover:bg-white/10 transition-colors cursor-pointer"
              title="Clear conversation history"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Chat Thread */}
      <div className="h-96 overflow-y-auto space-y-4 pr-2 rounded-2xl bg-[#0d1117] p-4 border border-[#30363d] no-scrollbar">
        {initialLoading ? (
          <div className="py-28 text-center text-xs text-slate-500 animate-pulse">
            Connecting to mentor…
          </div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl text-emerald-400">
              💬
            </div>
            <h4 className="text-sm font-semibold text-slate-100">
              What technical topic or skill would you like to explore?
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              I can answer in-depth questions about frameworks (FastAPI, React, Docker), explain programming concepts, solve code challenges, and give you personalized advice based on your verified GitHub activity.
            </p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isUser = m.role === 'user'
            return (
              <div
                key={idx}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs text-emerald-400 shrink-0 font-bold shadow-xs">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[88%] sm:max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-emerald-500 text-gray-950 font-medium rounded-tr-xs shadow-md'
                      : 'bg-[#161b22] border border-[#30363d] text-slate-200 rounded-tl-xs shadow-sm'
                  }`}
                >
                  {renderMessageContent(m.content)}
                </div>
              </div>
            )
          })
        )}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs text-emerald-400 shrink-0 font-bold">
              AI
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-xs bg-[#161b22] border border-[#30363d] text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-[11px] text-slate-400 ml-1">Thinking with Google AI…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Wide Question Prompt Chips */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
          Try asking wide questions:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {WIDE_PROMPTS.map((prompt) => (
            <button
              type="button"
              key={prompt}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              className="px-2.5 py-1.5 rounded-xl text-[11px] bg-[#0d1117] hover:bg-white/5 text-slate-300 hover:text-emerald-300 border border-[#30363d] transition-colors cursor-pointer disabled:opacity-50"
            >
              + {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Field Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSendMessage()
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask any technical question, code explanation, or career advice…"
          disabled={loading}
          className="flex-1 px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-500/20"
        >
          Send
        </button>
      </form>

      {/* Gemini API Key Modal */}
      {keyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="text-sm font-bold text-white">Google Gemini API Key</h3>
              </div>
              <button
                onClick={() => setKeyModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              SkillForge AI uses Google's <strong>gemini-1.5-flash</strong> model to answer open-ended engineering questions, debug code, and tailor roadmaps.
            </p>

            <div className="p-3 bg-[#0d1117] rounded-xl border border-[#30363d] text-xs space-y-1.5">
              <span className="text-slate-400">How to get a 100% free key:</span>
              <ol className="list-decimal list-inside text-slate-300 space-y-1">
                <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald-400 underline">Google AI Studio</a></li>
                <li>Click <strong>Create API Key</strong></li>
                <li>Paste it below to activate instant Google AI powers!</li>
              </ol>
            </div>

            {keySuccessMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 rounded-xl">
                {keySuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveApiKey} className="space-y-3">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setKeyModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white border border-[#30363d] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingKey || !apiKeyInput.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingKey ? 'Activating…' : 'Save & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

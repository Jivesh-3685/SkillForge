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
  const { currentUser, apiFetch, getIdToken } = useAuth()
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
  const [geminiStatus, setGeminiStatus] = useState(null)
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [savingKey, setSavingKey] = useState(false)
  const [keyMsg, setKeyMsg] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchGeminiStatus = useCallback(async () => {
    if (!currentUser) return
    try {
      const res = await apiFetch('/api/mentor/status')
      if (res.ok) {
        const data = await res.json()
        setGeminiStatus(data)
      }
    } catch {}
  }, [currentUser, apiFetch])

  const handleSaveGeminiKey = async (e) => {
    e?.preventDefault?.()
    const cleanKey = apiKeyInput.trim()
    if (!cleanKey) return
    try {
      setSavingKey(true)
      setKeyMsg('')
      const res = await apiFetch('/api/mentor/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: cleanKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to save key')
      setKeyMsg('✓ Gemini API key saved & activated!')
      setApiKeyInput('')
      await fetchGeminiStatus()
      setTimeout(() => setShowApiKeyInput(false), 1500)
    } catch (err) {
      setKeyMsg('Error: ' + err.message)
    } finally {
      setSavingKey(false)
    }
  }

  const handleRemoveGeminiKey = async () => {
    if (!confirm('Remove your saved Gemini API key?')) return
    try {
      setSavingKey(true)
      await apiFetch('/api/mentor/api-key', { method: 'DELETE' })
      setKeyMsg('Gemini key removed.')
      await fetchGeminiStatus()
      setTimeout(() => setShowApiKeyInput(false), 1200)
    } catch (err) {
      setKeyMsg('Error: ' + err.message)
    } finally {
      setSavingKey(false)
    }
  }

  const fetchHistory = useCallback(async () => {
    if (!currentUser) return
    try {
      setInitialLoading(true)
      const res = await apiFetch('/api/mentor/history')
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (err) {
      console.warn('Failed to fetch mentor history:', err)
    } finally {
      setInitialLoading(false)
    }
  }, [currentUser, apiFetch])

  useEffect(() => {
    if (currentUser) {
      fetchHistory()
      fetchGeminiStatus()
    }
  }, [currentUser, fetchHistory, fetchGeminiStatus])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || input).trim()
    if (!text || !currentUser || loading) return

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
      const res = await apiFetch('/api/mentor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok) {
        let errMessage = 'Failed to send message'
        try {
          const errData = await res.json()
          errMessage = errData.detail || errData.message || errMessage
        } catch {
          try {
            const rawText = await res.text()
            errMessage = rawText || `Server communication error (${res.status})`
          } catch {
            errMessage = `Server error (${res.status})`
          }
        }
        throw new Error(errMessage)
      }

      const data = await res.json()
      const newModelMsg = {
        role: 'model',
        content: data.reply,
        timestamp: data.timestamp,
      }
      setMessages((prev) => [...prev, newModelMsg])
    } catch (err) {
      // If token expired, attempt one manual force-refresh
      if (err.message && err.message.toLowerCase().includes('token expired')) {
        try {
          await getIdToken(true)
          setError('Session token refreshed. Please re-send your question.')
        } catch {
          setError(err.message)
        }
      } else {
        setError(err.message || 'Unable to connect to mentor server')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClearHistory = async () => {
    if (!currentUser || !confirm('Clear all mentor conversation history?')) return
    try {
      await apiFetch('/api/mentor/history', {
        method: 'DELETE',
      })
      setMessages([])
    } catch (err) {
      console.warn('Failed to clear history:', err)
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
            <h2 className="text-lg font-bold text-white tracking-tight">
              SkillForge AI Technical Mentor
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ask wide-ranging questions about software engineering, coding problems, architecture, frameworks, and your verified career gaps.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer font-medium ${
              geminiStatus?.has_gemini_key
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-xs'
            }`}
            title={geminiStatus?.has_gemini_key ? 'Gemini AI active — click to manage key' : 'Connect your Gemini API key'}
          >
            {geminiStatus?.has_gemini_key ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Gemini Active</span>
                <span className="text-[10px] opacity-60">⚙️</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Add Gemini Key</span>
              </>
            )}
          </button>

          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-[#30363d] hover:bg-white/10 transition-colors cursor-pointer"
              title="Clear conversation history"
            >
              Clear conversation
            </button>
          )}
        </div>
      </div>

      {/* Expandable Manual Gemini Key Setup Drawer */}
      {showApiKeyInput && (
        <div className="p-4 rounded-2xl bg-[#0d1117] border border-[#30363d] space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">✨</span>
              <h4 className="text-xs font-bold text-slate-200">
                Google Gemini API Key Setup
              </h4>
            </div>
            <button
              onClick={() => setShowApiKeyInput(false)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Connect your Gemini API key to ask open-ended, wide-ranging coding questions, multi-file architecture designs, and technical interview defense.
          </p>

          <form onSubmit={handleSaveGeminiKey} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Paste Gemini key (e.g. AIzaSy...)"
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#161b22] border border-[#30363d] text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={savingKey || !apiKeyInput.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-gray-950 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {savingKey ? 'Saving…' : 'Save & Activate'}
              </button>
              {geminiStatus?.has_gemini_key && (
                <button
                  type="button"
                  onClick={handleRemoveGeminiKey}
                  disabled={savingKey}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-red-500/10 border border-red-800/40 text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  Remove Key
                </button>
              )}
            </div>

            {keyMsg && (
              <p className={`text-xs ${keyMsg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
                {keyMsg}
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Keys are securely saved in your database and encrypted at rest.</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                Get free Gemini key ↗
              </a>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-200 cursor-pointer font-bold px-1"
          >
            ✕
          </button>
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
              <span className="text-[11px] text-slate-400 ml-1">AI Mentor is thinking…</span>
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
    </div>
  )
}

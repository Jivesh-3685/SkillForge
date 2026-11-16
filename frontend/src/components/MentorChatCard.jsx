import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

const QUICK_PROMPTS = [
  'What should I focus on today?',
  'Explain my #1 skill gap',
  'How do I bridge my gaps faster?',
  'Review my current roadmap milestone',
]

export default function MentorChatCard() {
  const { idToken, currentUser } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
      fetchHistory()
    }
  }, [idToken, fetchHistory])

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

  if (!currentUser) return null

  return (
    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
            Phase 10: Grounded AI Mentor (FR-09)
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Personal AI Technical Mentor
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400/90 px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
            ✓ Grounded in Your Code & Gaps
          </span>
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 transition-colors cursor-pointer"
              title="Clear conversation"
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
      <div className="h-80 overflow-y-auto space-y-3.5 pr-2 rounded-xl bg-gray-950/70 p-4 border border-gray-800/80">
        {initialLoading ? (
          <div className="py-24 text-center text-xs text-gray-500 animate-pulse">
            Connecting to mentor…
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              💬
            </div>
            <h4 className="text-sm font-semibold text-gray-200">Ask your mentor anything!</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              I can explain your roadmap, recommend how to bridge your largest gaps, or clarify technical concepts based on what you already know.
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
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xs text-emerald-400 shrink-0 font-bold">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-emerald-500 text-gray-950 font-medium rounded-tr-xs'
                      : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-xs whitespace-pre-wrap'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            )
          })
        )}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xs text-emerald-400 shrink-0">
              AI
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-xs bg-gray-900 border border-gray-800 text-xs text-gray-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            type="button"
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-emerald-300 border border-gray-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            + {prompt}
          </button>
        ))}
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
          placeholder="Ask a question about your skills, roadmap, or concepts…"
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-gray-950 border border-gray-800 rounded-xl text-xs text-gray-100 focus:outline-hidden focus:border-emerald-500 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}

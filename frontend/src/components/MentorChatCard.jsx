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
      console.warn('Failed to load mentor history:', err)
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

  const handleSendMessage = async (textToSend = '') => {
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
          <div key={i} className="my-2 rounded-md overflow-hidden border border-[#E9E9E7] bg-[#F7F7F5] text-[#37352F] font-mono text-[11px]">
            <div className="flex items-center justify-between px-3 py-1 bg-white border-b border-[#E9E9E7] text-[10px] text-[#787774]">
              <span>{language || 'code'}</span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(code)}
                className="hover:text-[#37352F] transition-colors"
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
    <div className="bg-white border border-[#E9E9E7] rounded-md p-6 text-[#37352F] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#E9E9E7]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h2 className="text-lg font-semibold text-[#37352F] tracking-tight">
              SkillForge AI Technical Mentor
            </h2>
          </div>
          <p className="text-xs text-[#787774] mt-0.5">
            Ask wide-ranging questions about software engineering, coding problems, architecture, frameworks, and your verified career gaps.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-all flex items-center gap-1.5 cursor-pointer font-medium ${
              geminiStatus?.has_gemini_key
                ? 'bg-[#DBEDDB] border-[#DBEDDB] text-[#1c3829]'
                : 'bg-[#FDECC8] border-[#FDECC8] text-[#402f1d]'
            }`}
            title={geminiStatus?.has_gemini_key ? 'Gemini AI active — click to manage key' : 'Connect your Gemini API key'}
          >
            {geminiStatus?.has_gemini_key ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#1c3829]" />
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
              className="text-xs text-[#787774] hover:text-[#37352F] px-2.5 py-1 rounded-md bg-[#F7F7F5] border border-[#E9E9E7] transition-colors cursor-pointer"
              title="Clear conversation history"
            >
              Clear conversation
            </button>
          )}
        </div>
      </div>

      {/* Expandable Manual Gemini Key Setup Drawer */}
      {showApiKeyInput && (
        <div className="p-4 rounded-md bg-[#F7F7F5] border border-[#E9E9E7] space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">✨</span>
              <h4 className="text-xs font-semibold text-[#37352F]">
                Google Gemini API Key Setup
              </h4>
            </div>
            <button
              onClick={() => setShowApiKeyInput(false)}
              className="text-[#787774] hover:text-[#37352F] text-xs px-1 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-[#787774] leading-relaxed">
            Connect your Gemini API key to ask open-ended, wide-ranging coding questions, multi-file architecture designs, and technical interview defense.
          </p>

          <form onSubmit={handleSaveGeminiKey} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Paste Gemini key (e.g. AIzaSy...)"
                className="flex-1 px-3 py-1.5 rounded-md bg-white border border-[#E9E9E7] text-xs text-[#37352F] placeholder-[#787774] focus:border-[#2383E2]"
              />
              <button
                type="submit"
                disabled={savingKey || !apiKeyInput.trim()}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-[#2383E2] hover:bg-[#1b6ec2] text-white disabled:opacity-50 transition-colors cursor-pointer"
              >
                {savingKey ? 'Saving…' : 'Save & Activate'}
              </button>
              {geminiStatus?.has_gemini_key && (
                <button
                  type="button"
                  onClick={handleRemoveGeminiKey}
                  disabled={savingKey}
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#FFE2DD] border border-[#E9E9E7] text-[#5d1715] hover:opacity-80 transition-colors cursor-pointer"
                >
                  Remove Key
                </button>
              )}
            </div>

            {keyMsg && (
              <p className={`text-xs ${keyMsg.startsWith('✓') ? 'text-[#1c3829]' : 'text-[#5d1715]'}`}>
                {keyMsg}
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] text-[#787774] pt-0.5">
              <span>Keys are securely saved in your database and encrypted at rest.</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[#2383E2] hover:underline flex items-center gap-1"
              >
                Get free Gemini key ↗
              </a>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#FFE2DD] border border-[#E9E9E7] rounded-md text-xs text-[#5d1715] flex items-center justify-between gap-2">
          <span>{error}</span>
          <button
            onClick={() => setError('')}
            className="text-[#5d1715] hover:opacity-75 cursor-pointer font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Chat Thread */}
      <div className="h-96 overflow-y-auto space-y-3.5 pr-1.5 rounded-md bg-[#F7F7F5] p-3.5 border border-[#E9E9E7] no-scrollbar">
        {initialLoading ? (
          <div className="py-28 text-center text-xs text-[#787774] animate-pulse">
            Connecting to mentor…
          </div>
        ) : messages.length === 0 ? (
          <div className="py-20 text-center space-y-2.5">
            <div className="w-10 h-10 mx-auto rounded-md bg-white border border-[#E9E9E7] flex items-center justify-center text-xl text-[#37352F]">
              💬
            </div>
            <h4 className="text-xs font-semibold text-[#37352F]">
              What technical topic or skill would you like to explore?
            </h4>
            <p className="text-xs text-[#787774] max-w-md mx-auto">
              I can answer in-depth questions about frameworks (FastAPI, React, Docker), explain programming concepts, solve code challenges, and give you personalized advice based on your verified GitHub activity.
            </p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isUser = m.role === 'user'
            return (
              <div
                key={idx}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded bg-white border border-[#E9E9E7] flex items-center justify-center text-[10px] text-[#37352F] shrink-0 font-semibold">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[88%] sm:max-w-[80%] p-3.5 rounded-md text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#2383E2] text-white font-normal'
                      : 'bg-white border border-[#E9E9E7] text-[#37352F]'
                  }`}
                >
                  {renderMessageContent(m.content)}
                </div>
              </div>
            )
          })
        )}

        {loading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-6 h-6 rounded bg-white border border-[#E9E9E7] flex items-center justify-center text-[10px] text-[#37352F] shrink-0 font-semibold">
              AI
            </div>
            <div className="p-3 rounded-md bg-white border border-[#E9E9E7] text-xs text-[#787774] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2383E2] animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#2383E2] animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#2383E2] animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-[11px] text-[#787774] ml-1">AI Mentor is thinking…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Wide Question Prompt Chips */}
      <div className="space-y-1.5">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#787774]">
          Try asking wide questions:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {WIDE_PROMPTS.map((prompt) => (
            <button
              type="button"
              key={prompt}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              className="px-2 py-1 rounded-md text-[11px] bg-[#F7F7F5] hover:bg-[rgba(55,53,47,0.06)] text-[#37352F] border border-[#E9E9E7] transition-colors cursor-pointer disabled:opacity-50"
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
          className="flex-1 px-3.5 py-2.5 bg-[#F7F7F5] border border-[#E9E9E7] rounded-md text-xs text-[#37352F] placeholder-[#787774] focus:border-[#2383E2] transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-[#2383E2] hover:bg-[#1b6ec2] text-white font-medium rounded-md text-xs transition-colors cursor-pointer disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}

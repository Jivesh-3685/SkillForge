import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ColdStartQuizModal({ isOpen, onClose, onCompleted }) {
  const { idToken } = useAuth()
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !idToken) return
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/skills/quiz/questions', {
          headers: { Authorization: `Bearer ${idToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          setQuestions(data.questions || [])
        }
      } catch (err) {
        setError('Failed to load assessment questions.')
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [isOpen, idToken])

  if (!isOpen) return null

  const handleSelectOption = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!idToken) return
    try {
      setError('')
      setSubmitting(true)
      const res = await fetch('/api/skills/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ answers }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to submit quiz')
      }
      if (onCompleted) onCompleted()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl text-gray-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
        >
          ✕
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono mb-2">
            Cold Start Self-Assessment
          </div>
          <h2 className="text-xl font-bold text-white">Seed Your Starting Skill Baseline</h2>
          <p className="text-xs text-gray-400 mt-1">
            Answer these 10 quick questions to establish your baseline skills. These will be marked with low confidence until verified by GitHub commits.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800 text-xs text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400 animate-pulse">
            Loading assessment questions…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-gray-950 rounded-xl border border-gray-800/80">
                <p className="text-sm font-semibold text-gray-200 mb-3">
                  <span className="text-emerald-400 font-mono mr-2">#{idx + 1}</span>
                  {q.question}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt) => {
                    const isSelected = answers[q.id] === opt.value
                    return (
                      <button
                        type="button"
                        key={opt.label}
                        onClick={() => handleSelectOption(q.id, opt.value)}
                        className={`text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/80 text-emerald-200'
                            : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-gray-800 flex justify-end gap-3 sticky bottom-0 bg-gray-900 pb-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-gray-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || Object.keys(answers).length === 0}
                className="px-5 py-2 text-xs font-bold text-gray-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saving Baseline…' : 'Calculate Seed Scores'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

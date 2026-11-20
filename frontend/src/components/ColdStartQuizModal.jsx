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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-[#E9E9E7] rounded-md p-6 shadow-none text-[#37352F] my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#787774] hover:text-[#37352F] p-1 cursor-pointer"
        >
          ✕
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#FDECC8] border border-[#fae0a6] text-[#402f1d] text-xs font-mono mb-2">
            Cold Start Self-Assessment
          </div>
          <h2 className="text-lg font-semibold text-[#37352F]">Seed Your Starting Skill Baseline</h2>
          <p className="text-xs text-[#787774] mt-1">
            Answer these 10 quick questions to establish your baseline skills. These will be marked with low confidence until verified by GitHub commits.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FFE2DD] border border-[#f5c6cb] text-xs text-[#5d1715] rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs text-[#787774] animate-pulse">
            Loading assessment questions…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-4 bg-[#F7F7F5] rounded-md border border-[#E9E9E7]">
                <p className="text-xs font-medium text-[#37352F] mb-3">
                  <span className="text-[#2383E2] font-mono mr-2">#{idx + 1}</span>
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
                        className={`text-left p-2.5 rounded-md border text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#D3E5EF] border-[#2383E2] text-[#183347] font-medium'
                            : 'bg-white border-[#E9E9E7] text-[#37352F] hover:bg-[#E9E9E7]/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-[#E9E9E7] flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium border border-[#E9E9E7] rounded-md text-[#787774] hover:text-[#37352F] hover:bg-[#F7F7F5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || Object.keys(answers).length === 0}
                className="px-4 py-2 text-xs font-medium bg-[#2383E2] hover:bg-[#1d6fc2] disabled:opacity-40 text-white rounded-md cursor-pointer transition-colors"
              >
                {submitting ? 'Saving…' : 'Save Baseline Assessment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

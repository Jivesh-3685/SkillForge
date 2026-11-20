import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import ColdStartQuizModal from './ColdStartQuizModal'

export default function SkillScoresCard() {
  const { idToken, currentUser } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quizOpen, setQuizOpen] = useState(false)

  const fetchScores = useCallback(async () => {
    if (!idToken) return
    try {
      setLoading(true)
      const res = await fetch('/api/skills/scores', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch {
      setError('Failed to load verified skill scores.')
    } finally {
      setLoading(false)
    }
  }, [idToken])

  useEffect(() => {
    if (idToken) {
      fetchScores()
    }
  }, [idToken, fetchScores])

  if (!currentUser) return null

  const scores = data?.scores || []
  const isColdStart = data?.is_cold_start

  const getConfidenceBadge = (confidence) => {
    switch (confidence) {
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#DBEDDB] text-[#1c3829]">
            High Confidence
          </span>
        )
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#D3E5EF] text-[#183347]">
            Medium Confidence
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FDECC8] text-[#402f1d]">
            Low Confidence
          </span>
        )
    }
  }

  const getScoreColor = (score) => {
    if (score >= 70) return 'bg-[#10b981]'
    if (score >= 40) return 'bg-[#2383E2]'
    return 'bg-[#f59e0b]'
  }

  return (
    <>
      <div className="bg-white border border-[#E9E9E7] rounded-md p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#37352F] flex items-center gap-2.5">
              <svg className="w-5 h-5 text-[#37352F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Verified Skill Scores
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#787774] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E9E9E7]">
              Formula v1.0 • Deterministic
            </span>
            <span className="text-[11px] font-mono text-[#787774] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E9E9E7]">
              Public Repos Only
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[#FFE2DD] border border-[#E9E9E7] rounded-md text-xs text-[#5d1715]">
            {error}
          </div>
        )}

        {/* Cold Start Notice */}
        {isColdStart && (
          <div className="p-4 rounded-md bg-[#FDECC8] border border-[#E9E9E7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-[#402f1d] flex items-center gap-1.5">
                <span>⚠️</span> Cold Start Learner Detected
              </h4>
              <p className="text-xs text-[#402f1d]/90 max-w-xl">
                You have fewer than 3 repositories or 30 commits on GitHub. You can take our 10-question self-assessment to seed your starting baseline before your code activity grows!
              </p>
            </div>
            <button
              onClick={() => setQuizOpen(true)}
              className="px-3 py-1.5 bg-[#402f1d] hover:bg-[#302315] text-white font-medium text-xs rounded-md transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              Take Self-Assessment Quiz
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-[#787774] animate-pulse">
            Computing verified skill scores…
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-8 p-4 rounded-md bg-[#F7F7F5] border border-[#E9E9E7] text-[#787774] text-xs">
            No code activity detected yet. Connect GitHub above or take the self-assessment quiz to establish your skill baseline.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {scores.map((skill) => (
                <div
                  key={skill.skill_id}
                  className="p-4 rounded-md bg-[#F7F7F5] border border-[#E9E9E7] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-[#37352F] flex items-center gap-2">
                        {skill.name}
                        <span className="text-[10px] font-normal text-[#787774] px-1.5 py-0.2 rounded bg-white border border-[#E9E9E7]">
                          {skill.category}
                        </span>
                      </h3>
                    </div>
                    {getConfidenceBadge(skill.confidence)}
                  </div>

                  {/* Progress bar and score */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#787774]">Proficiency Score</span>
                      <span className="text-[#37352F] font-semibold">{skill.score}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#E9E9E7] rounded-full overflow-hidden">
                      <div
                        style={{ width: `${skill.score}%` }}
                        className={`h-full ${getScoreColor(skill.score)} transition-all duration-500 rounded-full`}
                      />
                    </div>
                  </div>

                  {/* Signal Breakdown */}
                  {skill.metrics && (
                    <div className="flex items-center justify-between pt-2 border-t border-[#E9E9E7] text-[11px] font-mono text-[#787774]">
                      <span>Repos: <strong className="text-[#37352F]">{skill.metrics.repos_count}</strong></span>
                      <span>Commits: <strong className="text-[#37352F]">{skill.metrics.commits_count}</strong></span>
                      <span>Volume: <strong className="text-[#37352F]">{Math.round(skill.metrics.volume * 100)}%</strong></span>
                      <span>Recency: <strong className="text-[#37352F]">{Math.round(skill.metrics.recency * 100)}%</strong></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ColdStartQuizModal
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
        onCompleted={fetchScores}
      />
    </>
  )
}

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
    } catch (err) {
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
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            High Confidence
          </span>
        )
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            Medium Confidence
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Low Confidence
          </span>
        )
    }
  }

  const getScoreColor = (score) => {
    if (score >= 70) return 'bg-emerald-500'
    if (score >= 40) return 'bg-blue-500'
    return 'bg-amber-500'
  }

  return (
    <>
      <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
              Phase 3: GitHub Skill Analyzer (FR-03)
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Verified Skill Scores
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-400 px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800">
              Formula v1.0 • Deterministic
            </span>
            <span className="text-[11px] font-mono text-gray-500 px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800">
              Public Repos Only
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Cold Start Notice */}
        {isColdStart && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
                <span>⚠️</span> Cold Start Learner Detected
              </h4>
              <p className="text-xs text-gray-400 max-w-xl">
                You have fewer than 3 repositories or 30 commits on GitHub. You can take our 10-question self-assessment to seed your starting baseline before your code activity grows!
              </p>
            </div>
            <button
              onClick={() => setQuizOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs rounded-xl transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              Take Self-Assessment Quiz
            </button>
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500 animate-pulse">
            Computing verified skill scores…
          </div>
        ) : scores.length === 0 ? (
          <div className="text-center py-8 p-4 rounded-xl bg-gray-950 border border-gray-800 text-gray-400 text-sm">
            No code activity detected yet. Connect GitHub above or take the self-assessment quiz to establish your skill baseline.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {scores.map((skill) => (
                <div
                  key={skill.skill_id}
                  className="p-4 rounded-xl bg-gray-950/90 border border-gray-800/80 hover:border-gray-700 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        {skill.name}
                        <span className="text-[10px] font-normal text-gray-500 px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800">
                          {skill.category}
                        </span>
                      </h3>
                    </div>
                    {getConfidenceBadge(skill.confidence)}
                  </div>

                  {/* Progress bar and score */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-400">Proficiency Score</span>
                      <span className="text-white font-bold">{skill.score}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-800/80 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${skill.score}%` }}
                        className={`h-full ${getScoreColor(skill.score)} transition-all duration-500 rounded-full`}
                      />
                    </div>
                  </div>

                  {/* Signal Breakdown */}
                  {skill.metrics && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-900 text-[11px] font-mono text-gray-500">
                      <span>Repos: <strong className="text-gray-300">{skill.metrics.repos_count}</strong></span>
                      <span>Commits: <strong className="text-gray-300">{skill.metrics.commits_count}</strong></span>
                      <span>Volume: <strong className="text-gray-300">{Math.round(skill.metrics.volume * 100)}%</strong></span>
                      <span>Recency: <strong className="text-gray-300">{Math.round(skill.metrics.recency * 100)}%</strong></span>
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

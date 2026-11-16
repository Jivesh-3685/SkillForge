import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export default function SkillGapCard() {
  const { idToken, currentUser } = useAuth()
  const [careers, setCareers] = useState([])
  const [activeGoal, setActiveGoal] = useState('ai_engineer')
  const [gapData, setGapData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState('')

  // 1. Fetch available career profiles
  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const res = await fetch('/api/goals')
        if (res.ok) {
          const data = await res.json()
          setCareers(data.careers || [])
        }
      } catch (err) {
        console.error('Failed to load careers:', err)
      }
    }
    fetchCareers()
  }, [])

  // 2. Fetch gaps for active goal
  const fetchGaps = useCallback(async (goalId) => {
    if (!idToken) return
    try {
      setLoading(true)
      const res = await fetch(`/api/skills/gaps?goal_id=${goalId}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setGapData(data)
        setActiveGoal(data.career_id)
      }
    } catch (err) {
      setError('Failed to compute skill gaps.')
    } finally {
      setLoading(false)
    }
  }, [idToken])

  useEffect(() => {
    if (idToken) {
      fetchGaps(activeGoal)
    }
  }, [idToken, fetchGaps, activeGoal])

  // 3. Switch active career goal
  const handleSelectGoal = async (goalId) => {
    if (goalId === activeGoal || !idToken) return
    try {
      setSwitching(true)
      setActiveGoal(goalId)
      await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ goal_id: goalId }),
      })
      await fetchGaps(goalId)
    } catch (err) {
      setError('Failed to update career goal.')
    } finally {
      setSwitching(false)
    }
  }

  if (!currentUser) return null

  const gaps = gapData?.gaps || []
  const summary = gapData?.summary
  const matchPct = gapData?.match_percentage ?? 0

  return (
    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
            Phase 4: Skill Gap Analysis (FR-04)
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Target Career & Skill Gaps
          </h2>
        </div>

        <span className="text-[11px] font-mono text-gray-400 px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 self-start sm:self-auto">
          Instant Comparison • Zero AI Latency
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Career Goal Switcher Tabs */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Select Your Career Goal
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {careers.map((career) => {
            const isSelected = career.id === activeGoal
            return (
              <button
                type="button"
                key={career.id}
                onClick={() => handleSelectGoal(career.id)}
                disabled={switching}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/80 text-white shadow-xs shadow-emerald-500/10'
                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{career.icon || '🎯'}</span>
                  <span className="font-bold text-sm text-white">{career.title}</span>
                </div>
                <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                  {career.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500 animate-pulse">
          Computing career gaps…
        </div>
      ) : (
        <div className="space-y-6">
          {/* Match Readiness Overview Banner */}
          <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Circular percentage */}
              <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-gray-900 border-2 border-emerald-500/40">
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  {matchPct}%
                </span>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {gapData?.career_title} Readiness
                </h3>
                <p className="text-xs text-gray-400">
                  Target readiness based on your verified skills & baseline quiz.
                </p>
              </div>
            </div>

            {summary && (
              <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300">
                  {summary.mastered} Mastered
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300">
                  {summary.below_target} Below Target
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300">
                  {summary.missing} Missing
                </span>
              </div>
            )}
          </div>

          {/* Ranked Skill Gaps List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Ranked Skill Requirements & Shortfalls
              </h3>
              <span className="text-[11px] font-mono text-gray-500">
                Sorted by Priority Impact (Shortfall × Weight)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {gaps.map((item, idx) => {
                const isMastered = item.severity === 'mastered'
                const isMissing = item.severity === 'missing'

                return (
                  <div
                    key={item.skill_id}
                    className="p-3.5 rounded-xl bg-gray-950/80 border border-gray-800/80 hover:border-gray-700/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    {/* Left: Name & Badges */}
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <span className="text-xs font-mono text-gray-500 w-5">#{idx + 1}</span>
                      <div>
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isMastered ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              ✓ Goal Mastered
                            </span>
                          ) : isMissing ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                              Missing Entirely
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Below Target
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-gray-500">
                            Weight: {item.weight}x
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Progress comparison */}
                    <div className="flex-1 max-w-md space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-gray-400">Current: <strong className="text-white">{item.current_score}%</strong></span>
                        <span className="text-gray-400">Target: <strong className="text-emerald-400">{item.target_score}%</strong></span>
                      </div>
                      <div className="relative h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${item.current_score}%` }}
                          className={`h-full ${
                            isMastered
                              ? 'bg-emerald-500'
                              : isMissing
                              ? 'bg-red-500'
                              : 'bg-amber-500'
                          } rounded-full`}
                        />
                        {/* Target marker line */}
                        <div
                          style={{ left: `${item.target_score}%` }}
                          className="absolute top-0 bottom-0 w-0.5 bg-white/60"
                          title={`Target: ${item.target_score}%`}
                        />
                      </div>
                    </div>

                    {/* Right: Shortfall requirement */}
                    <div className="text-right min-w-[100px]">
                      {isMastered ? (
                        <span className="text-xs font-mono text-emerald-400 font-bold">
                          Ready ✓
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-amber-400 font-bold">
                          +{item.shortfall}% gap
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

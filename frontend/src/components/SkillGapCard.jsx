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
    } catch {
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
    } catch {
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
    <div className="bg-white border border-[#E9E9E7] rounded-md p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#37352F] flex items-center gap-2.5">
            <svg className="w-5 h-5 text-[#37352F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Target Career & Skill Gaps
          </h2>
        </div>

        <span className="text-[11px] font-mono text-[#787774] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E9E9E7] self-start sm:self-auto">
          Instant Comparison • Zero AI Latency
        </span>
      </div>

      {error && (
        <div className="p-3 bg-[#FFE2DD] border border-[#E9E9E7] rounded-md text-xs text-[#5d1715]">
          {error}
        </div>
      )}

      {/* Career Goal Switcher Tabs */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-[#787774]">
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
                className={`p-3.5 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#F7F7F5] border-[#37352F] text-[#37352F]'
                    : 'bg-white border-[#E9E9E7] text-[#787774] hover:bg-[rgba(55,53,47,0.04)] hover:text-[#37352F]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{career.icon || '🎯'}</span>
                  <span className="font-semibold text-xs text-[#37352F]">{career.title}</span>
                </div>
                <p className="text-[11px] text-[#787774] line-clamp-2 leading-relaxed">
                  {career.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-[#787774] animate-pulse">
          Computing career gaps…
        </div>
      ) : (
        <div className="space-y-5">
          {/* Match Readiness Overview Banner */}
          <div className="p-4 rounded-md bg-[#F7F7F5] border border-[#E9E9E7] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Circular percentage */}
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-[#E9E9E7] text-[#37352F] font-semibold text-sm font-mono">
                {matchPct}%
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#37352F]">
                  {gapData?.career_title} Readiness
                </h3>
                <p className="text-xs text-[#787774]">
                  Target readiness based on your verified skills & baseline quiz.
                </p>
              </div>
            </div>

            {summary && (
              <div className="flex items-center gap-2 sm:gap-2.5 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-[#DBEDDB] text-[#1c3829] font-medium">
                  {summary.mastered} Mastered
                </span>
                <span className="px-2 py-0.5 rounded bg-[#FDECC8] text-[#402f1d] font-medium">
                  {summary.below_target} Below Target
                </span>
                <span className="px-2 py-0.5 rounded bg-[#FFE2DD] text-[#5d1715] font-medium">
                  {summary.missing} Missing
                </span>
              </div>
            )}
          </div>

          {/* Ranked Skill Gaps List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#787774]">
                Ranked Skill Requirements & Shortfalls
              </h3>
              <span className="text-[11px] font-mono text-[#787774]">
                Sorted by Priority Impact (Shortfall × Weight)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {gaps.map((item, idx) => {
                const isMastered = item.severity === 'mastered'
                const isMissing = item.severity === 'missing'

                return (
                  <div
                    key={item.skill_id}
                    className="p-3 rounded-md bg-white border border-[#E9E9E7] hover:bg-[rgba(55,53,47,0.02)] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    {/* Left: Name & Badges */}
                    <div className="flex items-center gap-2.5 min-w-[200px]">
                      <span className="text-xs font-mono text-[#787774] w-5">#{idx + 1}</span>
                      <div>
                        <h4 className="text-xs font-semibold text-[#37352F]">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isMastered ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#DBEDDB] text-[#1c3829]">
                              ✓ Mastered
                            </span>
                          ) : isMissing ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#FFE2DD] text-[#5d1715]">
                              Missing
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#FDECC8] text-[#402f1d]">
                              Below Target
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-[#787774]">
                            Weight: {item.weight}x
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Progress comparison */}
                    <div className="flex-1 max-w-md space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#787774]">Current: <strong className="text-[#37352F]">{item.current_score}%</strong></span>
                        <span className="text-[#787774]">Target: <strong className="text-[#2383E2]">{item.target_score}%</strong></span>
                      </div>
                      <div className="relative h-2 w-full bg-[#E9E9E7] rounded-full overflow-hidden">
                        <div
                          style={{ width: `${item.current_score}%` }}
                          className={`h-full ${
                            isMastered
                              ? 'bg-[#10b981]'
                              : isMissing
                              ? 'bg-[#f43f5e]'
                              : 'bg-[#f59e0b]'
                          } rounded-full`}
                        />
                        {/* Target marker line */}
                        <div
                          style={{ left: `${item.target_score}%` }}
                          className="absolute top-0 bottom-0 w-0.5 bg-[#37352F]"
                          title={`Target: ${item.target_score}%`}
                        />
                      </div>
                    </div>

                    {/* Right: Shortfall requirement */}
                    <div className="text-right min-w-[90px]">
                      {isMastered ? (
                        <span className="text-xs font-mono text-[#1c3829] font-medium">
                          Ready ✓
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-[#402f1d] font-medium">
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

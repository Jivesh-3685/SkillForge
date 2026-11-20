import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export default function RoadmapCard() {
  const { idToken, currentUser } = useAuth()
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [weeklyHours, setWeeklyHours] = useState(10)
  const [error, setError] = useState('')
  const [togglingTaskId, setTogglingTaskId] = useState(null)

  const fetchRoadmap = useCallback(async () => {
    if (!idToken) return
    try {
      setLoading(true)
      const res = await fetch('/api/roadmap', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setRoadmap(data.roadmap)
      }
    } catch {
      setError('Failed to load learning roadmap.')
    } finally {
      setLoading(false)
    }
  }, [idToken])

  useEffect(() => {
    if (idToken) {
      fetchRoadmap()
    }
  }, [idToken, fetchRoadmap])

  const handleGenerate = async () => {
    if (!idToken) return
    try {
      setGenerating(true)
      setError('')
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ weekly_hours: weeklyHours }),
      })
      if (res.ok) {
        const data = await res.json()
        setRoadmap(data.roadmap)
      } else {
        const errData = await res.json()
        setError(errData.detail || 'Roadmap generation failed.')
      }
    } catch {
      setError('Network error while generating roadmap.')
    } finally {
      setGenerating(false)
    }
  }

  const handleToggleTask = async (taskId, currentStatus) => {
    if (!idToken || togglingTaskId) return
    try {
      setTogglingTaskId(taskId)
      const newStatus = !currentStatus

      // Optimistic update
      setRoadmap((prev) => {
        if (!prev) return prev
        const updatedWeeks = prev.weeks.map((w) => ({
          ...w,
          tasks: w.tasks.map((t) => (t.task_id === taskId ? { ...t, completed: newStatus } : t)),
        }))
        return { ...prev, weeks: updatedWeeks }
      })

      const res = await fetch('/api/roadmap/task/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          task_id: taskId,
          completed: newStatus,
        }),
      })

      if (!res.ok) {
        // Rollback on error
        await fetchRoadmap()
      }
    } catch {
      await fetchRoadmap()
    } finally {
      setTogglingTaskId(null)
    }
  }

  if (!currentUser) return null

  const weeks = roadmap?.weeks || []
  const progress = roadmap?.progress || { percentage: 0, completed_tasks: 0, total_tasks: 0 }

  return (
    <div className="bg-white border border-[#E9E9E7] rounded-md p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#37352F] flex items-center gap-2.5">
            <svg className="w-5 h-5 text-[#37352F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Personalized Learning Roadmap
          </h2>
        </div>

        {roadmap && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E9E9E7] text-[#787774]">
              {roadmap.generated_by === 'gemini' ? '✨ Gemini AI' : '📋 Adaptive Plan'}
            </span>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-2.5 py-1 text-xs font-medium bg-[#F7F7F5] hover:bg-[rgba(55,53,47,0.06)] text-[#37352F] border border-[#E9E9E7] rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {generating ? 'Regenerating…' : '↻ Regenerate'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-[#FFE2DD] border border-[#E9E9E7] rounded-md text-xs text-[#5d1715]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-[#787774] animate-pulse">
          Loading learning roadmap…
        </div>
      ) : !roadmap ? (
        /* Empty State: Prompt to generate */
        <div className="p-8 rounded-md bg-[#F7F7F5] border border-[#E9E9E7] text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-md bg-white border border-[#E9E9E7] flex items-center justify-center text-[#37352F]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#37352F]">Generate Your Personalized Roadmap</h3>
            <p className="text-xs text-[#787774] max-w-md mx-auto mt-1">
              SkillForge AI will synthesize your verified gaps into a structured, week-by-week action plan tailored to your available study hours.
            </p>
          </div>

          {/* Time Commitment Selector */}
          <div className="max-w-xs mx-auto flex items-center justify-between p-2 rounded-md bg-white border border-[#E9E9E7] text-xs font-mono">
            <span className="text-[#787774]">Study time:</span>
            <div className="flex gap-1">
              {[5, 10, 15, 20].map((hours) => (
                <button
                  type="button"
                  key={hours}
                  onClick={() => setWeeklyHours(hours)}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    weeklyHours === hours
                      ? 'bg-[#2383E2] text-white font-medium'
                      : 'text-[#787774] hover:text-[#37352F] hover:bg-[#F7F7F5]'
                  }`}
                >
                  {hours}h/wk
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2383E2] hover:bg-[#1b6ec2] text-white font-medium rounded-md text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {generating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Generating Roadmap…
              </>
            ) : (
              '⚡ Generate Learning Roadmap'
            )}
          </button>
        </div>
      ) : (
        /* Active Roadmap Plan View */
        <div className="space-y-5">
          {/* Progress Overview Card */}
          <div className="p-4 rounded-md bg-[#F7F7F5] border border-[#E9E9E7] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-white border border-[#E9E9E7] flex items-center justify-center font-semibold text-[#37352F] font-mono text-sm">
                {progress.percentage}%
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#37352F]">
                  {roadmap.career_title} — {roadmap.total_weeks}-Week Roadmap
                </h3>
                <p className="text-xs text-[#787774]">
                  {progress.completed_tasks} of {progress.total_tasks} tasks finished ({progress.completed_hours} / {progress.total_hours} hrs completed)
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full md:w-48 space-y-1">
              <div className="h-2 w-full bg-[#E9E9E7] rounded-full overflow-hidden">
                <div
                  style={{ width: `${progress.percentage}%` }}
                  className="h-full bg-[#2383E2] rounded-full transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Weeks Accordion / List */}
          <div className="space-y-3">
            {weeks.map((week) => {
              const weekCompleted = week.tasks.every((t) => t.completed)
              return (
                <div
                  key={week.week_number}
                  className={`p-4 rounded-md border transition-all ${
                    weekCompleted
                      ? 'bg-[#DBEDDB]/20 border-[#DBEDDB]'
                      : 'bg-white border-[#E9E9E7]'
                  }`}
                >
                  {/* Week Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#E9E9E7]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-[#F7F7F5] border border-[#E9E9E7] flex items-center justify-center text-xs font-mono font-semibold text-[#37352F]">
                        {week.week_number}
                      </span>
                      <h4 className="text-xs font-semibold text-[#37352F]">{week.theme}</h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {week.target_skills.map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-[#F7F7F5] text-[#787774] border border-[#E9E9E7]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[#787774] mt-2 mb-3 leading-relaxed">
                    {week.summary}
                  </p>

                  {/* Task List */}
                  <div className="space-y-1.5">
                    {week.tasks.map((task) => {
                      const isToggling = togglingTaskId === task.task_id
                      return (
                        <div
                          key={task.task_id}
                          onClick={() => handleToggleTask(task.task_id, task.completed)}
                          className={`p-2.5 rounded-md border flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                            task.completed
                              ? 'bg-white border-[#E9E9E7] text-[#787774]'
                              : 'bg-[#F7F7F5] border-[#E9E9E7] hover:bg-[rgba(55,53,47,0.04)] text-[#37352F]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              readOnly
                              className="w-3.5 h-3.5 rounded border-[#E9E9E7] text-[#2383E2] focus:ring-0 bg-white cursor-pointer"
                            />
                            <span
                              className={`text-xs ${
                                task.completed ? 'line-through text-[#787774]' : 'font-medium'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono text-[#787774]">
                            {isToggling ? (
                              <span className="text-[#2383E2] animate-pulse">saving…</span>
                            ) : (
                              <span>~{task.estimated_hours}h</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

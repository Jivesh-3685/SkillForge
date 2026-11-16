import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export default function RoadmapCard() {
  const { idToken, currentUser } = useAuth()
  const [roadmap, setRoadmap] = useState(null)
  const [weeklyHours, setWeeklyHours] = useState(10)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [togglingTaskId, setTogglingTaskId] = useState(null)
  const [error, setError] = useState('')

  const fetchRoadmap = useCallback(async () => {
    if (!idToken) return
    try {
      setLoading(true)
      const res = await fetch('/api/roadmap', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.has_roadmap) {
          setRoadmap(data)
        } else {
          setRoadmap(null)
        }
      }
    } catch (err) {
      setError('Failed to fetch learning roadmap.')
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
      setError('')
      setGenerating(true)
      const res = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ weekly_hours: weeklyHours }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Failed to generate roadmap')
      }
      const data = await res.json()
      setRoadmap(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleToggleTask = async (taskId, currentStatus) => {
    if (!idToken) return
    try {
      setTogglingTaskId(taskId)
      const res = await fetch(`/api/roadmap/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ completed: !currentStatus }),
      })
      if (res.ok) {
        const updated = await res.json()
        setRoadmap(updated)
      }
    } catch (err) {
      console.error('Failed to toggle task:', err)
    } finally {
      setTogglingTaskId(null)
    }
  }

  if (!currentUser) return null

  const progress = roadmap?.progress || { percentage: 0, completed_tasks: 0, total_tasks: 0 }
  const weeks = roadmap?.weeks || []

  return (
    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
            Phase 5: AI Roadmap Generator (FR-05)
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Personalized Learning Roadmap
          </h2>
        </div>

        {roadmap && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-gray-950 border border-gray-800 text-gray-400">
              {roadmap.generated_by === 'gemini' ? '✨ Gemini AI' : '📋 Adaptive Plan'}
            </span>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-3 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-gray-750 text-gray-200 border border-gray-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {generating ? 'Regenerating…' : '↻ Regenerate'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500 animate-pulse">
          Loading learning roadmap…
        </div>
      ) : !roadmap ? (
        /* Empty State: Prompt to generate */
        <div className="p-8 rounded-xl bg-gray-950 border border-gray-800 text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Generate Your Personalized Roadmap</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
              SkillForge AI will synthesize your verified gaps into a structured, week-by-week action plan tailored to your available study hours.
            </p>
          </div>

          {/* Time Commitment Selector */}
          <div className="max-w-xs mx-auto flex items-center justify-between p-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs font-mono">
            <span className="text-gray-400">Study time:</span>
            <div className="flex gap-1.5">
              {[5, 10, 15, 20].map((hours) => (
                <button
                  type="button"
                  key={hours}
                  onClick={() => setWeeklyHours(hours)}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    weeklyHours === hours
                      ? 'bg-emerald-500 text-gray-950 font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></span>
                Generating Roadmap…
              </>
            ) : (
              '⚡ Generate Learning Roadmap'
            )}
          </button>
        </div>
      ) : (
        /* Active Roadmap Plan View */
        <div className="space-y-6">
          {/* Progress Overview Card */}
          <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 font-mono text-base">
                {progress.percentage}%
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {roadmap.career_title} — {roadmap.total_weeks}-Week Roadmap
                </h3>
                <p className="text-xs text-gray-400">
                  {progress.completed_tasks} of {progress.total_tasks} tasks finished ({progress.completed_hours} / {progress.total_hours} hrs completed)
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full md:w-48 space-y-1">
              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                <div
                  style={{ width: `${progress.percentage}%` }}
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                />
              </div>
            </div>
          </div>

          {/* Weeks Accordion / List */}
          <div className="space-y-4">
            {weeks.map((week) => {
              const weekCompleted = week.tasks.every((t) => t.completed)
              return (
                <div
                  key={week.week_number}
                  className={`p-5 rounded-xl border transition-all ${
                    weekCompleted
                      ? 'bg-emerald-950/15 border-emerald-800/40'
                      : 'bg-gray-950/80 border-gray-800/80'
                  }`}
                >
                  {/* Week Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-900">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-gray-900 border border-gray-800 flex items-center justify-center text-xs font-mono font-bold text-emerald-400">
                        {week.week_number}
                      </span>
                      <h4 className="text-sm font-bold text-white">{week.theme}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {week.target_skills.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-gray-900 text-gray-400 border border-gray-800"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mt-2 mb-4 leading-relaxed">
                    {week.summary}
                  </p>

                  {/* Task List */}
                  <div className="space-y-2">
                    {week.tasks.map((task) => {
                      const isToggling = togglingTaskId === task.task_id
                      return (
                        <div
                          key={task.task_id}
                          onClick={() => handleToggleTask(task.task_id, task.completed)}
                          className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors cursor-pointer select-none ${
                            task.completed
                              ? 'bg-emerald-950/20 border-emerald-900/40 text-gray-400'
                              : 'bg-gray-900/60 border-gray-800/80 hover:border-gray-700 text-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              readOnly
                              className="w-4 h-4 rounded-sm border-gray-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-gray-950 cursor-pointer"
                            />
                            <span
                              className={`text-xs ${
                                task.completed ? 'line-through text-gray-500' : 'font-medium'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono text-gray-500">
                            {isToggling ? (
                              <span className="text-emerald-400 animate-pulse">saving…</span>
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

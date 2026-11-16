import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ProjectsCard() {
  const { idToken, currentUser } = useAuth()
  const [projectsData, setProjectsData] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [error, setError] = useState('')

  const fetchProjects = useCallback(async () => {
    if (!idToken) return
    try {
      setLoading(true)
      const res = await fetch('/api/projects/recommendations', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProjectsData(data)
      }
    } catch (err) {
      setError('Failed to fetch matched projects.')
    } finally {
      setLoading(false)
    }
  }, [idToken])

  useEffect(() => {
    if (idToken) {
      fetchProjects()
    }
  }, [idToken, fetchProjects])

  const handleStatusChange = async (projectId, newStatus) => {
    if (!idToken) return
    try {
      setUpdatingId(projectId)
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        // Update local state
        setProjectsData((prev) => {
          if (!prev) return prev
          const updatedProjects = prev.projects.map((p) =>
            p.id === projectId ? { ...p, status: newStatus } : p
          )
          const inProgress = updatedProjects.filter((p) => p.status === 'in_progress').length
          const completed = updatedProjects.filter((p) => p.status === 'completed').length
          return {
            ...prev,
            projects: updatedProjects,
            in_progress_count: inProgress,
            completed_count: completed,
          }
        })
      }
    } catch (err) {
      console.error('Failed to update project status:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  if (!currentUser) return null

  const allProjects = projectsData?.projects || []
  const filteredProjects =
    filter === 'all'
      ? allProjects
      : allProjects.filter((p) => p.status === filter)

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Beginner
          </span>
        )
      case 'Advanced':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
            Advanced
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Intermediate
          </span>
        )
    }
  }

  return (
    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
            Phase 7: Project Recommendation (FR-07)
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Matched Portfolio Projects
          </h2>
        </div>

        {projectsData && (
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-300">
              {projectsData.in_progress_count} In Progress
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
              {projectsData.completed_count} Completed
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'all', label: `All (${allProjects.length})` },
          { key: 'in_progress', label: `In Progress (${projectsData?.in_progress_count ?? 0})` },
          { key: 'suggested', label: 'Suggested' },
          { key: 'completed', label: `Completed (${projectsData?.completed_count ?? 0})` },
        ].map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              filter === tab.key
                ? 'bg-emerald-500 text-gray-950 font-bold'
                : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500 animate-pulse">
          Matching projects to your skill profile…
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-6 rounded-xl bg-gray-950 border border-gray-800 text-center text-sm text-gray-400">
          No projects found in this view.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((proj) => {
            const isUpdating = updatingId === proj.id
            const isCompleted = proj.status === 'completed'
            const isInProgress = proj.status === 'in_progress'

            return (
              <div
                key={proj.id}
                className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/15 border-emerald-800/40'
                    : isInProgress
                    ? 'bg-blue-950/15 border-blue-800/50'
                    : 'bg-gray-950/80 border-gray-800/80 hover:border-gray-700'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getDifficultyBadge(proj.difficulty)}
                      <span className="text-[10px] font-mono text-emerald-400/90 px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800">
                        {proj.readiness_label}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-gray-500">
                      ⏱️ ~{proj.estimated_hours}h
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{proj.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{proj.description}</p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {proj.primary_skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-gray-900 text-gray-300 border border-gray-800"
                      >
                        {s}
                      </span>
                    ))}
                    {proj.stretch_skills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                      >
                        <span>⚡</span> {s} (Stretch)
                      </span>
                    ))}
                  </div>

                  {/* Deliverables */}
                  {proj.deliverables && (
                    <div className="pt-2 border-t border-gray-900 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                        Target GitHub Deliverables:
                      </span>
                      <ul className="text-[11px] text-gray-400 space-y-0.5 list-disc list-inside">
                        {proj.deliverables.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Status action buttons */}
                <div className="pt-3 border-t border-gray-900 flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-500">
                    Status:{' '}
                    <strong className={isCompleted ? 'text-emerald-400' : isInProgress ? 'text-blue-400' : 'text-gray-400'}>
                      {isCompleted ? 'Completed ✓' : isInProgress ? 'In Progress' : 'Suggested'}
                    </strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {!isCompleted && !isInProgress && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(proj.id, 'in_progress')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isUpdating ? 'Saving…' : 'Start Project'}
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(proj.id, 'completed')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isUpdating ? 'Saving…' : '✓ Mark Complete'}
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(proj.id, 'suggested')}
                        disabled={isUpdating}
                        className="px-2.5 py-1 text-gray-500 hover:text-gray-400 text-[11px] font-mono cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

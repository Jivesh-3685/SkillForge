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
    } catch {
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
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#DBEDDB] text-[#1c3829]">
            Beginner
          </span>
        )
      case 'Advanced':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FFE2DD] text-[#5d1715]">
            Advanced
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FDECC8] text-[#402f1d]">
            Intermediate
          </span>
        )
    }
  }

  return (
    <div className="bg-white border border-[#E9E9E7] rounded-md p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#37352F] flex items-center gap-2.5">
            <svg className="w-5 h-5 text-[#37352F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Matched Portfolio Projects
          </h2>
        </div>

        {projectsData && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-0.5 rounded bg-[#D3E5EF] text-[#183347] font-medium">
              {projectsData.in_progress_count} In Progress
            </span>
            <span className="px-2.5 py-0.5 rounded bg-[#DBEDDB] text-[#1c3829] font-medium">
              {projectsData.completed_count} Completed
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-[#FFE2DD] border border-[#E9E9E7] rounded-md text-xs text-[#5d1715]">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
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
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
              filter === tab.key
                ? 'bg-[#2383E2] text-white font-medium'
                : 'bg-[#F7F7F5] text-[#787774] hover:text-[#37352F] border border-[#E9E9E7]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-[#787774] animate-pulse">
          Matching projects to your skill profile…
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-6 rounded-md bg-[#F7F7F5] border border-[#E9E9E7] text-center text-xs text-[#787774]">
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
                className={`p-4 rounded-md border flex flex-col justify-between space-y-3.5 transition-all ${
                  isCompleted
                    ? 'bg-[#DBEDDB]/20 border-[#DBEDDB]'
                    : isInProgress
                    ? 'bg-[#D3E5EF]/20 border-[#D3E5EF]'
                    : 'bg-white border-[#E9E9E7] hover:bg-[rgba(55,53,47,0.02)]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getDifficultyBadge(proj.difficulty)}
                      <span className="text-[10px] font-mono text-[#787774] px-1.5 py-0.2 rounded bg-[#F7F7F5] border border-[#E9E9E7]">
                        {proj.readiness_label}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#787774]">
                      ⏱️ ~{proj.estimated_hours}h
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#37352F]">{proj.title}</h3>
                  <p className="text-xs text-[#787774] leading-relaxed">{proj.description}</p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {proj.primary_skills.map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-[#F7F7F5] text-[#37352F] border border-[#E9E9E7]"
                      >
                        {s}
                      </span>
                    ))}
                    {proj.stretch_skills.map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-[#FDECC8] text-[#402f1d] flex items-center gap-1"
                      >
                        <span>⚡</span> {s} (Stretch)
                      </span>
                    ))}
                  </div>

                  {/* Deliverables */}
                  {proj.deliverables && (
                    <div className="pt-2 border-t border-[#E9E9E7] space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#787774] block">
                        Target GitHub Deliverables:
                      </span>
                      <ul className="text-xs text-[#787774] space-y-0.5 list-disc list-inside">
                        {proj.deliverables.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Status action buttons */}
                <div className="pt-2.5 border-t border-[#E9E9E7] flex items-center justify-between">
                  <span className="text-xs font-mono text-[#787774]">
                    Status:{' '}
                    <strong className={isCompleted ? 'text-[#1c3829]' : isInProgress ? 'text-[#183347]' : 'text-[#787774]'}>
                      {isCompleted ? 'Completed ✓' : isInProgress ? 'In Progress' : 'Suggested'}
                    </strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {!isCompleted && !isInProgress && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(proj.id, 'in_progress')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 bg-[#2383E2] hover:bg-[#1b6ec2] text-white rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isUpdating ? 'Saving…' : 'Start Project'}
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(proj.id, 'completed')}
                        disabled={isUpdating}
                        className="px-3 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-md text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isUpdating ? 'Saving…' : '✓ Mark Complete'}
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(proj.id, 'suggested')}
                        disabled={isUpdating}
                        className="px-2.5 py-1 text-[#787774] hover:text-[#37352F] text-[11px] font-mono cursor-pointer"
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

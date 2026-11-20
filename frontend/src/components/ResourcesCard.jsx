import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ResourcesCard() {
  const { idToken, currentUser } = useAuth()
  const [resourcesBySkill, setResourcesBySkill] = useState({})
  const [selectedSkill, setSelectedSkill] = useState('all')
  const [loading, setLoading] = useState(true)
  const [feedbackState, setFeedbackState] = useState({})
  const [error, setError] = useState('')

  const fetchRoadmapResources = useCallback(async () => {
    if (!idToken) return
    try {
      setLoading(true)
      const res = await fetch('/api/resources/roadmap', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setResourcesBySkill(data.resources_by_skill || {})
      }
    } catch {
      setError('Failed to fetch recommended resources.')
    } finally {
      setLoading(false)
    }
  }, [idToken])

  useEffect(() => {
    if (idToken) {
      fetchRoadmapResources()
    }
  }, [idToken, fetchRoadmapResources])

  const handleFeedback = async (resourceId, helpful) => {
    if (!idToken) return
    try {
      setFeedbackState((prev) => ({ ...prev, [resourceId]: helpful ? 'helpful' : 'not_helpful' }))
      await fetch(`/api/resources/${resourceId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ helpful }),
      })
    } catch (err) {
      console.error('Failed to submit feedback:', err)
    }
  }

  if (!currentUser) return null

  // Flatten or filter resources
  const availableSkills = Object.keys(resourcesBySkill)
  let displayedResources = []

  if (selectedSkill === 'all') {
    Object.entries(resourcesBySkill).forEach(([skillId, items]) => {
      items.forEach((item) => {
        displayedResources.push({ ...item, skillId })
      })
    })
  } else if (resourcesBySkill[selectedSkill]) {
    displayedResources = resourcesBySkill[selectedSkill].map((item) => ({
      ...item,
      skillId: selectedSkill,
    }))
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'video':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FFE2DD] text-[#5d1715] flex items-center gap-1">
            <span>🎥</span> Video
          </span>
        )
      case 'course':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FDECC8] text-[#402f1d] flex items-center gap-1">
            <span>🎓</span> Course
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#D3E5EF] text-[#183347] flex items-center gap-1">
            <span>📄</span> Doc
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Verified Free Learning Resources
          </h2>
        </div>

        <span className="text-[11px] font-mono text-[#787774] px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E9E9E7] self-start sm:self-auto">
          100% Free • Verified Zero Dead Links
        </span>
      </div>

      {error && (
        <div className="p-3 bg-[#FFE2DD] border border-[#E9E9E7] rounded-md text-xs text-[#5d1715]">
          {error}
        </div>
      )}

      {/* Skill Filter Pills */}
      {availableSkills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedSkill('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
              selectedSkill === 'all'
                ? 'bg-[#2383E2] text-white font-medium'
                : 'bg-[#F7F7F5] text-[#787774] hover:text-[#37352F] border border-[#E9E9E7]'
            }`}
          >
            All Skills ({displayedResources.length})
          </button>
          {availableSkills.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setSelectedSkill(s)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono uppercase transition-colors cursor-pointer ${
                selectedSkill === s
                  ? 'bg-[#2383E2] text-white font-medium'
                  : 'bg-[#F7F7F5] text-[#787774] hover:text-[#37352F] border border-[#E9E9E7]'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-[#787774] animate-pulse">
          Loading learning resources…
        </div>
      ) : displayedResources.length === 0 ? (
        <div className="p-6 rounded-md bg-[#F7F7F5] border border-[#E9E9E7] text-center text-xs text-[#787774]">
          Generate your learning roadmap above to unlock personalized resources matched to your study plan!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayedResources.map((res) => {
            const fb = feedbackState[res.id]
            return (
              <div
                key={res.id}
                className="p-4 rounded-md bg-white border border-[#E9E9E7] hover:bg-[rgba(55,53,47,0.02)] transition-colors flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {getTypeBadge(res.type)}
                    <span className="text-[11px] font-mono text-[#787774]">
                      ⏱️ {res.estimated_minutes} min
                    </span>
                  </div>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-[#37352F] hover:text-[#2383E2] transition-colors flex items-center gap-1.5 leading-snug"
                  >
                    {res.title}
                    <span className="text-xs text-[#787774] font-normal">↗</span>
                  </a>

                  <p className="text-xs text-[#787774] mt-1">
                    Provided by: <span className="text-[#37352F] font-medium">{res.source}</span>
                  </p>
                </div>

                {/* Footer / Feedback controls */}
                <div className="pt-2 border-t border-[#E9E9E7] flex items-center justify-between text-xs font-mono text-[#787774]">
                  <span className="text-[10px] uppercase text-[#787774]">
                    {res.skill_id || res.skillId}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#787774]">Helpful?</span>
                    <button
                      type="button"
                      onClick={() => handleFeedback(res.id, true)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                        fb === 'helpful'
                          ? 'bg-[#DBEDDB] text-[#1c3829] font-medium'
                          : 'bg-[#F7F7F5] border border-[#E9E9E7] hover:bg-[rgba(55,53,47,0.08)] text-[#37352F]'
                      }`}
                    >
                      👍
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback(res.id, false)}
                      className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                        fb === 'not_helpful'
                          ? 'bg-[#FFE2DD] text-[#5d1715] font-medium'
                          : 'bg-[#F7F7F5] border border-[#E9E9E7] hover:bg-[rgba(55,53,47,0.08)] text-[#37352F]'
                      }`}
                    >
                      👎
                    </button>
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

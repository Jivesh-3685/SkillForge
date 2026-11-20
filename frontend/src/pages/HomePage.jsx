import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import AuthModal from '../components/AuthModal'
import UserAvatar from '../components/UserAvatar'

const API_URL = import.meta.env.VITE_API_URL || ''

function StatusDot({ ok, label }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-2 w-2 rounded-full ${
          ok === null
            ? 'bg-[#787774] animate-pulse'
            : ok
              ? 'bg-[#2e7d32]'
              : 'bg-[#c62828]'
        }`}
      />
      <span className="text-xs text-[#37352F]">{label}</span>
      <span className="ml-auto text-[10px] font-mono text-[#787774]">
        {ok === null ? 'checking…' : ok ? 'ok' : 'offline'}
      </span>
    </div>
  )
}

export default function HomePage({ onNavigate }) {
  const { currentUser, userProfile } = useAuth()
  const { t } = useTheme()
  const [prompt, setPrompt] = useState('')
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setError(null)
        const res = await fetch(`${API_URL}/api/health`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setHealth(data)
      } catch (err) {
        setError(err.message)
        setHealth(null)
      }
    }
    checkHealth()
  }, [])

  const handlePromptSubmit = (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    try {
      sessionStorage.setItem('sf_initial_prompt', prompt.trim())
    } catch {}
    onNavigate('mentor')
  }

  const quickPills = [
    { id: 'skills', icon: '⚡', label: t('chipSkills', 'Analyze Skills') },
    { id: 'gaps', icon: '🎯', label: t('chipGaps', 'Career Gaps') },
    { id: 'roadmap', icon: '🗺️', label: t('chipRoadmap', 'AI Roadmap') },
    { id: 'resume', icon: '📄', label: t('chipResume', 'Resume Match') },
    { id: 'projects', icon: '💻', label: t('chipProjects', 'Projects') },
    { id: 'mentor', icon: '🤖', label: t('chipMentor', 'Ask Mentor') },
  ]

  const integrations = [
    { name: 'GitHub', icon: '🐙' },
    { name: 'FastAPI', icon: '⚡' },
    { name: 'React', icon: '⚛️' },
    { name: 'Supabase', icon: '⚡' },
    { name: 'Gemini AI', icon: '✨' },
  ]

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Notion AI Hero Section */}
      <div className="flex flex-col items-center text-center space-y-4 pt-4">
        {/* Official Brand Logo */}
        <div className="w-14 h-14 rounded-md p-1 bg-[#F7F7F5] border border-[#E9E9E7] flex items-center justify-center">
          <img
            src="/logo.png"
            alt="SkillForge AI Logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Heading */}
        <div className="space-y-1.5 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#37352F]">
            {currentUser
              ? `${t('heroGreeting', 'What can I forge for you today?')}, ${userProfile?.display_name?.split(' ')[0] || currentUser.displayName?.split(' ')[0] || 'Learner'}!`
              : t('heroGreeting', 'What can I forge for you today?')}
          </h1>
          <p className="text-xs sm:text-sm text-[#787774]">
            {t('heroSubtitle', 'Your GitHub-verified AI learning mentor. Turn real repository commits into career readiness and targeted roadmaps.')}
          </p>
        </div>

        {/* Notion AI Prompt Box */}
        <div className="w-full max-w-2xl">
          <form
            onSubmit={handlePromptSubmit}
            className="rounded-md border border-[#E9E9E7] bg-[#F7F7F5] p-3 transition-all focus-within:border-[#2383E2] focus-within:bg-white"
          >
            <textarea
              rows={2}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handlePromptSubmit(e)
                }
              }}
              placeholder={t('promptPlaceholder', "Ask SkillForge AI anything… (e.g. 'What is my weakest skill gap?')")}
              className="w-full bg-transparent resize-none text-xs sm:text-sm text-[#37352F] placeholder-[#787774] focus:outline-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E9E9E7]">
              {/* Quick Action Pills inside box */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setPrompt('Review my top skill gaps and suggest where to start.')
                  }}
                  className="text-[11px] px-2 py-0.5 rounded border border-[#E9E9E7] text-[#787774] bg-white hover:bg-[rgba(55,53,47,0.06)] hover:text-[#37352F] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {t('reviewForMe', '+ Review for me')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrompt('What project should I build next to improve my portfolio?')
                  }}
                  className="text-[11px] px-2 py-0.5 rounded border border-[#E9E9E7] text-[#787774] bg-white hover:bg-[rgba(55,53,47,0.06)] hover:text-[#37352F] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {t('projectIdeas', '💡 Project ideas')}
                </button>
              </div>

              {/* Submit Arrow */}
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="w-7 h-7 rounded bg-[#2383E2] hover:bg-[#1b6ec2] disabled:opacity-30 disabled:hover:bg-[#2383E2] text-white flex items-center justify-center transition-all cursor-pointer"
                title="Send to AI Mentor"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          </form>

          {/* Connected App Badges */}
          <div className="flex items-center justify-center gap-2.5 mt-3 text-xs text-[#787774]">
            <span className="text-[11px]">
              {t('groundedIn', 'Grounded in real code proof')}:
            </span>
            <div className="flex items-center gap-1.5">
              {integrations.map((app) => (
                <span
                  key={app.name}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.2 rounded bg-[#F7F7F5] border border-[#E9E9E7] text-[#787774]"
                  title={app.name}
                >
                  <span>{app.icon}</span>
                  <span className="hidden sm:inline">{app.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Navigation Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
          {quickPills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => onNavigate(pill.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E9E9E7] bg-white hover:bg-[rgba(55,53,47,0.04)] transition-all text-xs font-medium text-[#37352F] cursor-pointer"
            >
              <span className="text-sm">{pill.icon}</span>
              <span>{pill.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Interactive Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* User Status Card */}
        <div className="bg-white border border-[#E9E9E7] rounded-md p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#787774]">
              {t('accountTitle', 'Profile Information')}
            </h3>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#DBEDDB] text-[#1c3829]">
              {currentUser ? 'Active' : 'Guest'}
            </span>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-3">
              <UserAvatar user={currentUser} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate text-[#37352F]">
                  {userProfile?.display_name || currentUser.displayName || 'Learner'}
                </p>
                <p className="text-[11px] truncate text-[#787774]">
                  {currentUser.email}
                </p>
                <p className="text-[10px] text-[#2e7d32] mt-0.5">
                  ✓ Synchronized with Supabase (PostgreSQL)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs text-[#787774]">
                Sign in to sync your GitHub profile, calculate real skill metrics, and save learning progress.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="w-full py-1.5 rounded-md text-xs font-medium bg-[#2383E2] hover:bg-[#1b6ec2] text-white transition-colors cursor-pointer"
              >
                {t('signIn', 'Sign In / Register')}
              </button>
            </div>
          )}
        </div>

        {/* System Health Status */}
        <div className="bg-white border border-[#E9E9E7] rounded-md p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#787774]">
              Engine Health
            </h3>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F7F7F5] text-[#787774] border border-[#E9E9E7]">
              Zero-Downtime
            </span>
          </div>

          <div className="space-y-2 text-[#37352F] pt-0.5">
            <StatusDot ok={health?.backend ?? null} label="FastAPI Scoring Engine" />
            <StatusDot
              ok={health?.database ?? null}
              label={
                health?.database_provider === 'supabase'
                  ? 'Supabase PostgreSQL (Connected)'
                  : 'Supabase / High-Speed Store'
              }
            />
          </div>

          {error && (
            <div className="p-2 rounded bg-[#FFE2DD] border border-[#E9E9E7] text-[11px] text-[#5d1715]">
              Connection notice: {error}
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

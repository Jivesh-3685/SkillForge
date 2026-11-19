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
            ? 'bg-gray-400 animate-pulse'
            : ok
              ? 'bg-emerald-400'
              : 'bg-rose-500'
        }`}
      />
      <span className="text-xs text-inherit">{label}</span>
      <span className="ml-auto text-[10px] font-mono opacity-60">
        {ok === null ? 'checking…' : ok ? 'ok' : 'offline'}
      </span>
    </div>
  )
}

export default function HomePage({ onNavigate }) {
  const { currentUser, userProfile } = useAuth()
  const { theme, t } = useTheme()
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
    <div className="space-y-10 max-w-4xl mx-auto py-4">
      {/* Notion AI Hero Section */}
      <div className="flex flex-col items-center text-center space-y-6 pt-6">
        {/* Official Brand Logo Mascot */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-500 via-emerald-500 to-teal-400 p-[2px] shadow-2xl shadow-emerald-500/20">
            <img
              src="/logo.png"
              alt="SkillForge AI Logo"
              className="w-full h-full rounded-[22px] object-cover"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#161b22] flex items-center justify-center text-white text-[10px] shadow-sm">
            ⚡
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2 max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
            {currentUser
              ? `${t('heroGreeting', 'What can I forge for you today?')}, ${userProfile?.display_name?.split(' ')[0] || currentUser.displayName?.split(' ')[0] || 'Learner'}!`
              : t('heroGreeting', 'What can I forge for you today?')}
          </h1>
          <p className="text-sm text-slate-400">
            {t('heroSubtitle', 'Your GitHub-verified AI learning mentor. Turn real repository commits into career readiness and targeted roadmaps.')}
          </p>
        </div>

        {/* Notion AI Prompt Box */}
        <div className="w-full max-w-2xl">
          <form
            onSubmit={handlePromptSubmit}
            className="relative rounded-2xl border border-[#30363d] bg-[#161b22] p-3.5 shadow-2xl transition-all focus-within:border-emerald-500/70 focus-within:ring-2 focus-within:ring-emerald-500/20"
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
              className="w-full bg-transparent resize-none text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.04]">
              {/* Quick Action Pills inside box */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setPrompt('Review my top skill gaps and suggest where to start.')
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-[#30363d] text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {t('reviewForMe', '+ Review for me')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrompt('What project should I build next to improve my portfolio?')
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-[#30363d] text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {t('projectIdeas', '💡 Project ideas')}
                </button>
              </div>

              {/* Submit Arrow */}
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:hover:bg-emerald-500 text-gray-950 flex items-center justify-center transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                title="Send to AI Mentor"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          </form>

          {/* Connected App Badges */}
          <div className="flex items-center justify-center gap-3 mt-3 text-xs text-slate-400">
            <span className="text-[11px] opacity-70">
              {t('groundedIn', 'Grounded in real code proof')}:
            </span>
            <div className="flex items-center gap-2">
              {integrations.map((app) => (
                <span
                  key={app.name}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06]"
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
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {quickPills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => onNavigate(pill.id)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#30363d] bg-[#161b22] hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all text-xs font-medium text-slate-100 shadow-sm group cursor-pointer"
            >
              <span className="text-base group-hover:scale-110 transition-transform">{pill.icon}</span>
              <span>{pill.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Interactive Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        {/* User Status Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t('accountTitle', 'Profile Information')}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {currentUser ? 'Active' : 'Guest'}
            </span>
          </div>

          {currentUser ? (
            <div className="flex items-center gap-3.5">
              <UserAvatar user={currentUser} size="xl" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-slate-100">
                  {userProfile?.display_name || currentUser.displayName || 'Learner'}
                </p>
                <p className="text-xs truncate text-slate-400">
                  {currentUser.email}
                </p>
                <p className="text-[10px] font-mono text-emerald-400 mt-0.5">
                  ✓ Synchronized with Supabase (PostgreSQL)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Sign in to sync your GitHub profile, calculate real skill metrics, and save learning progress.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-gray-950 transition-colors shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                {t('signIn', 'Sign In / Register')}
              </button>
            </div>
          )}
        </div>

        {/* System Health Status */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Engine Health
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
              Zero-Downtime
            </span>
          </div>

          <div className="space-y-2.5 text-slate-400 pt-1">
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
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-[11px] text-red-300">
              Connection notice: {error}
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

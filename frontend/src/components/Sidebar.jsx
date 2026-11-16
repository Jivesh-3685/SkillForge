import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import AuthModal from './AuthModal'

export default function Sidebar({ activePage, onNavigate, onOpenCommandPalette }) {
  const { currentUser, userProfile, logout } = useAuth()
  const { settings, updateSetting, theme } = useTheme()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const collapsed = settings.sidebarCollapsed

  const toggleCollapse = () => {
    updateSetting('sidebarCollapsed', !collapsed)
  }

  const sections = [
    {
      label: 'Core Views',
      items: [
        { id: 'home', icon: '🏠', name: 'Home' },
        { id: 'progress', icon: '📊', name: 'Progress Dashboard' },
        { id: 'mentor', icon: '🤖', name: 'AI Mentor' },
      ],
    },
    {
      label: 'Skills & Verification',
      items: [
        { id: 'github', icon: '🐙', name: 'GitHub Sync' },
        { id: 'skills', icon: '⚡', name: 'Skill Scores' },
        { id: 'gaps', icon: '🎯', name: 'Skill Gaps' },
        { id: 'resume', icon: '📄', name: 'Resume Matcher' },
      ],
    },
    {
      label: 'Learning & Execution',
      items: [
        { id: 'roadmap', icon: '🗺️', name: 'AI Roadmap' },
        { id: 'resources', icon: '📚', name: 'Curated Resources' },
        { id: 'projects', icon: '💻', name: 'Portfolio Projects' },
        { id: 'growth', icon: '📈', name: 'Growth History' },
      ],
    },
  ]

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-screen z-40 flex flex-col border-r transition-all duration-300 ${theme.sidebar} ${theme.border} ${
          collapsed ? 'w-[64px]' : 'w-[260px]'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className={`flex items-center justify-between h-14 px-3.5 border-b ${theme.border} flex-shrink-0`}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] flex items-center justify-center shadow-sm flex-shrink-0">
                <div className="w-full h-full bg-[#161b22] rounded-[11px] flex items-center justify-center">
                  <span className="text-emerald-400 font-extrabold text-xs">SF</span>
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold text-xs tracking-tight truncate ${theme.text}`}>
                    SkillForge AI
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    v1.0
                  </span>
                </div>
                <p className={`text-[10px] truncate ${theme.textMuted}`}>
                  GitHub Learning Mentor
                </p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] flex items-center justify-center mx-auto">
              <div className="w-full h-full bg-[#161b22] rounded-[11px] flex items-center justify-center">
                <span className="text-emerald-400 font-extrabold text-xs">SF</span>
              </div>
            </div>
          )}

          <button
            onClick={toggleCollapse}
            className={`w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors ${theme.textMuted}`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Search / Command Palette Trigger (Notion AI Style) */}
        <div className="p-2 border-b border-white/[0.04] flex-shrink-0">
          <button
            onClick={onOpenCommandPalette}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${theme.border} bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 transition-all ${
              collapsed ? 'justify-center px-1' : ''
            }`}
            title="Search or ask (Ctrl+K)"
          >
            <span className="text-xs">🔍</span>
            {!collapsed && (
              <>
                <span className={`text-xs ${theme.textMuted} flex-1 text-left`}>
                  Search or ask…
                </span>
                <kbd className={`text-[9px] px-1 py-0.5 rounded border ${theme.border} ${theme.textMuted} font-mono`}>
                  Ctrl+K
                </kbd>
              </>
            )}
          </button>
        </div>

        {/* Quick Icon Row (Notion Top Row) */}
        {!collapsed && (
          <div className="px-2 pt-1 pb-2 flex gap-1 border-b border-white/[0.04]">
            <button
              onClick={() => onNavigate('home')}
              className={`flex-1 py-1.5 rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors ${
                activePage === 'home'
                  ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                  : `${theme.textMuted} hover:bg-white/5 hover:text-white`
              }`}
            >
              <span>🏠</span> Home
            </button>
            <button
              onClick={() => onNavigate('mentor')}
              className={`flex-1 py-1.5 rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors ${
                activePage === 'mentor'
                  ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                  : `${theme.textMuted} hover:bg-white/5 hover:text-white`
              }`}
            >
              <span>💬</span> Chat
            </button>
            <button
              onClick={() => onNavigate('roadmap')}
              className={`flex-1 py-1.5 rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors ${
                activePage === 'roadmap'
                  ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                  : `${theme.textMuted} hover:bg-white/5 hover:text-white`
              }`}
            >
              <span>📅</span> Plan
            </button>
          </div>
        )}

        {/* User Card */}
        <div className={`px-3 py-2.5 border-b ${theme.border} flex-shrink-0`}>
          {currentUser ? (
            <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt=""
                  className="w-7 h-7 rounded-full border border-emerald-500/30 object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                  {(currentUser.displayName || currentUser.email || 'U')[0]}
                </div>
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold truncate ${theme.text}`}>
                    {userProfile?.display_name || currentUser.displayName || 'Learner'}
                  </p>
                  <p className={`text-[10px] truncate ${theme.textMuted}`}>
                    {currentUser.email}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className={`w-full py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors ${
                collapsed ? 'px-1' : 'px-3'
              }`}
            >
              {collapsed ? '👤' : 'Sign In / Register'}
            </button>
          )}
        </div>

        {/* Section Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {sections.map((section) => (
            <div key={section.label} className="mb-2">
              {!collapsed && (
                <p className={`px-3.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider ${theme.textMuted}`}>
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = activePage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.name : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 mx-0.5 rounded-lg text-left transition-all group ${
                      collapsed ? 'justify-center mx-auto w-[calc(100%-8px)]' : ''
                    } ${
                      isActive
                        ? 'bg-emerald-500/12 text-emerald-400 font-semibold'
                        : `${theme.textMuted} hover:bg-white/5 hover:text-white`
                    }`}
                  >
                    <span className="text-sm flex-shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <span className="text-xs truncate">{item.name}</span>
                    )}
                    {!collapsed && isActive && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer Area with Settings and Quick Theme toggle */}
        <div className={`border-t ${theme.border} p-2 space-y-1 flex-shrink-0`}>
          <button
            onClick={() => onNavigate('settings')}
            title={collapsed ? 'Settings' : undefined}
            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-all ${
              collapsed ? 'justify-center' : ''
            } ${
              activePage === 'settings'
                ? 'bg-emerald-500/12 text-emerald-400 font-semibold'
                : `${theme.textMuted} hover:bg-white/5 hover:text-white`
            }`}
          >
            <span className="text-sm flex-shrink-0">⚙️</span>
            {!collapsed && <span className="text-xs">Settings & Appearance</span>}
          </button>

          {currentUser && (
            <button
              onClick={logout}
              title={collapsed ? 'Sign Out' : undefined}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left transition-all ${
                collapsed ? 'justify-center' : ''
              } text-red-400/70 hover:bg-red-500/10 hover:text-red-400`}
            >
              <span className="text-sm flex-shrink-0">🚪</span>
              {!collapsed && <span className="text-xs">Sign Out</span>}
            </button>
          )}
        </div>
      </aside>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  )
}

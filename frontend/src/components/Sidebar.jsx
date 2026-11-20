import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import AuthModal from './AuthModal'
import UserAvatar from './UserAvatar'

export default function Sidebar({
  activePage,
  onNavigate,
  onOpenCommandPalette,
  mobileOpen,
  onMobileClose,
}) {
  const { currentUser, userProfile, logout } = useAuth()
  const { settings, updateSetting, t } = useTheme()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [isHoveringBorder, setIsHoveringBorder] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  const collapsed = settings.sidebarCollapsed
  const sidebarWidth = settings.sidebarWidth || 260
  const dragStartX = useRef(0)
  const dragStartWidth = useRef(sidebarWidth)
  const hasDragged = useRef(false)

  const toggleCollapse = () => {
    updateSetting(
      'sidebarCollapsed',
      !collapsed,
      !collapsed ? 'Sidebar collapsed (Ctrl+\\ to open)' : 'Sidebar expanded'
    )
  }

  // Keyboard shortcut Ctrl+\ or Cmd+\ to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '\\' || e.code === 'Backslash')) {
        e.preventDefault()
        toggleCollapse()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [collapsed])

  // Mouse Drag to Resize Sidebar
  const handleMouseDown = (e) => {
    e.preventDefault()
    setIsResizing(true)
    hasDragged.current = false
    dragStartX.current = e.clientX
    dragStartWidth.current = sidebarWidth

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - dragStartX.current
      if (Math.abs(delta) > 3) {
        hasDragged.current = true
      }
      const newWidth = Math.min(Math.max(dragStartWidth.current + delta, 190), 460)
      updateSetting('sidebarWidth', newWidth)
    }

    const onMouseUp = () => {
      setIsResizing(false)
      setIsHoveringBorder(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const sections = [
    {
      label: t('coreViews', 'Core Views'),
      items: [
        { id: 'home', icon: '🏠', name: t('home', 'Home') },
        { id: 'progress', icon: '📊', name: t('progress', 'Progress Dashboard') },
        { id: 'mentor', icon: '🤖', name: t('mentor', 'AI Mentor') },
      ],
    },
    {
      label: t('skillsVerification', 'Skills & Verification'),
      items: [
        { id: 'github', icon: '🐙', name: t('github', 'GitHub Sync') },
        { id: 'skills', icon: '⚡', name: t('skills', 'Skill Scores') },
        { id: 'gaps', icon: '🎯', name: t('gaps', 'Skill Gaps') },
        { id: 'resume', icon: '📄', name: t('resume', 'Resume Matcher') },
      ],
    },
    {
      label: t('learningExecution', 'Learning & Execution'),
      items: [
        { id: 'roadmap', icon: '🗺️', name: t('roadmap', 'AI Roadmap') },
        { id: 'resources', icon: '📚', name: t('resources', 'Curated Resources') },
        { id: 'projects', icon: '💻', name: t('projects', 'Portfolio Projects') },
        { id: 'growth', icon: '📈', name: t('growth', 'Growth History') },
      ],
    },
  ]

  const computedWidth = collapsed ? 64 : sidebarWidth

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs md:hidden animate-fadeIn"
        />
      )}

      <aside
        style={{
          width: computedWidth,
          transition: isResizing ? 'none' : 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s ease',
        }}
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col border-r bg-[#F7F7F5] border-[#E9E9E7] select-none overflow-x-hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="flex items-center justify-between h-14 px-3.5 border-b border-[#E9E9E7] flex-shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md p-0.5 flex items-center justify-center flex-shrink-0 bg-white border border-[#E9E9E7]">
                <img
                  src="/logo.png"
                  alt="SkillForge Logo"
                  className="w-full h-full rounded object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-xs tracking-tight truncate text-[#37352F]">
                    SkillForge AI
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-medium bg-[#DBEDDB] text-[#1c3829]">
                    v1.0
                  </span>
                </div>
                <p className="text-[10px] truncate text-[#787774]">
                  GitHub Learning Mentor
                </p>
              </div>
            </div>
          ) : (
            <div className="w-7 h-7 rounded-md p-0.5 flex items-center justify-center mx-auto bg-white border border-[#E9E9E7]">
              <img
                src="/logo.png"
                alt="SkillForge Logo"
                className="w-full h-full rounded object-contain"
              />
            </div>
          )}

          {/* Collapse Button / Mobile Close Button */}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleCollapse}
              className="w-6 h-6 rounded hover:bg-[rgba(55,53,47,0.08)] hidden md:flex items-center justify-center transition-colors text-[#787774] cursor-pointer"
              title={collapsed ? 'Expand sidebar (Ctrl+\\)' : 'Collapse sidebar (Ctrl+\\)'}
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Mobile close button */}
            <button
              onClick={onMobileClose}
              className="w-6 h-6 rounded flex md:hidden items-center justify-center hover:bg-[rgba(55,53,47,0.08)] text-[#787774]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search / Command Palette Trigger */}
        <div className="p-2 border-b border-[#E9E9E7] flex-shrink-0">
          <button
            onClick={onOpenCommandPalette}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-[#E9E9E7] bg-white hover:bg-[rgba(55,53,47,0.04)] transition-all cursor-pointer ${
              collapsed ? 'justify-center px-1' : ''
            }`}
            title="Search or ask (Ctrl+K)"
          >
            <span className="text-xs text-[#787774]">🔍</span>
            {!collapsed && (
              <>
                <span className="text-xs text-[#787774] flex-1 text-left truncate">
                  {t('searchOrAsk', 'Search or ask…')}
                </span>
                <kbd className="text-[9px] px-1 py-0.5 rounded border border-[#E9E9E7] text-[#787774] bg-[#F7F7F5] font-mono">
                  Ctrl+K
                </kbd>
              </>
            )}
          </button>
        </div>

        {/* Quick Icon Row (Notion Top Row) */}
        {!collapsed && (
          <div className="px-2 pt-1 pb-2 flex gap-1 border-b border-[#E9E9E7]">
            <button
              onClick={() => {
                onNavigate('home')
                onMobileClose?.()
              }}
              className={`flex-1 py-1 rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activePage === 'home'
                  ? 'bg-[rgba(55,53,47,0.08)] text-[#37352F] font-semibold'
                  : 'text-[#787774] hover:bg-[rgba(55,53,47,0.04)] hover:text-[#37352F]'
              }`}
            >
              <span>🏠</span> {t('home', 'Home')}
            </button>
            <button
              onClick={() => {
                onNavigate('mentor')
                onMobileClose?.()
              }}
              className={`flex-1 py-1 rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activePage === 'mentor'
                  ? 'bg-[rgba(55,53,47,0.08)] text-[#37352F] font-semibold'
                  : 'text-[#787774] hover:bg-[rgba(55,53,47,0.04)] hover:text-[#37352F]'
              }`}
            >
              <span>💬</span> {t('mentor', 'Mentor')}
            </button>
            <button
              onClick={() => {
                onNavigate('roadmap')
                onMobileClose?.()
              }}
              className={`flex-1 py-1 rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activePage === 'roadmap'
                  ? 'bg-[rgba(55,53,47,0.08)] text-[#37352F] font-semibold'
                  : 'text-[#787774] hover:bg-[rgba(55,53,47,0.04)] hover:text-[#37352F]'
              }`}
            >
              <span>📅</span> {t('roadmap', 'Plan')}
            </button>
          </div>
        )}

        {/* User Card */}
        <div className="px-3 py-2 border-b border-[#E9E9E7] flex-shrink-0">
          {currentUser ? (
            <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
              <UserAvatar user={currentUser} size="sm" />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-[#37352F]">
                    {userProfile?.display_name || currentUser.displayName || 'Learner'}
                  </p>
                  <p className="text-[10px] truncate text-[#787774]">
                    {currentUser.email}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className={`w-full py-1.5 rounded-md text-xs font-medium bg-[#2383E2] text-white hover:bg-[#1b6ec2] transition-colors cursor-pointer ${
                collapsed ? 'px-1' : 'px-3'
              }`}
            >
              {collapsed ? '👤' : t('signIn', 'Sign In / Register')}
            </button>
          )}
        </div>

        {/* Section Navigation Items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-1.5 no-scrollbar space-y-2">
          {sections.map((section) => (
            <div key={section.label} className="space-y-0.5">
              {!collapsed && (
                <p className="px-2.5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#787774]">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const isActive = activePage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id)
                      onMobileClose?.()
                    }}
                    title={collapsed ? item.name : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-all group cursor-pointer ${
                      collapsed ? 'justify-center px-0' : ''
                    } ${
                      isActive
                        ? 'bg-[rgba(55,53,47,0.08)] text-[#37352F] font-semibold'
                        : 'text-[#787774] hover:bg-[rgba(55,53,47,0.04)] hover:text-[#37352F]'
                    }`}
                  >
                    <span className="text-sm flex-shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <span className="text-xs truncate">{item.name}</span>
                    )}
                    {!collapsed && isActive && (
                      <div className="ml-auto w-1 h-3 rounded-full bg-[#2383E2]" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer Area with Settings and Sign out */}
        <div className="border-t border-[#E9E9E7] p-2 space-y-0.5 flex-shrink-0">
          <button
            onClick={() => {
              onNavigate('settings')
              onMobileClose?.()
            }}
            title={collapsed ? t('settings', 'Settings') : undefined}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-all cursor-pointer ${
              collapsed ? 'justify-center' : ''
            } ${
              activePage === 'settings'
                ? 'bg-[rgba(55,53,47,0.08)] text-[#37352F] font-semibold'
                : 'text-[#787774] hover:bg-[rgba(55,53,47,0.04)] hover:text-[#37352F]'
            }`}
          >
            <span className="text-sm flex-shrink-0">⚙️</span>
            {!collapsed && <span className="text-xs">{t('settings', 'Settings & Preferences')}</span>}
          </button>

          {currentUser && (
            <button
              onClick={logout}
              title={collapsed ? t('signOut', 'Sign Out') : undefined}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-left transition-all cursor-pointer ${
                collapsed ? 'justify-center' : ''
              } text-[#5d1715] hover:bg-[#FFE2DD]`}
            >
              <span className="text-sm flex-shrink-0">🚪</span>
              {!collapsed && <span className="text-xs">{t('signOut', 'Sign Out')}</span>}
            </button>
          )}
        </div>

        {/* ─── Notion-Style Draggable Edge ─── */}
        <div
          onMouseEnter={() => setIsHoveringBorder(true)}
          onMouseLeave={() => !isResizing && setIsHoveringBorder(false)}
          onMouseDown={handleMouseDown}
          onClick={() => {
            if (!hasDragged.current) {
              toggleCollapse()
            }
          }}
          className={`absolute top-0 right-0 w-2.5 h-full cursor-col-resize z-40 transition-colors hidden md:block ${
            isHoveringBorder || isResizing ? 'bg-[#2383E2]/20' : 'hover:bg-[#E9E9E7]'
          }`}
          title="Drag to resize, click to collapse"
        >
          <div
            className={`w-[1px] h-full ml-auto transition-colors ${
              isHoveringBorder || isResizing ? 'bg-[#2383E2]' : 'bg-transparent'
            }`}
          />
        </div>

        {/* Notion Tooltip on Hover */}
        {(isHoveringBorder || isResizing) && !collapsed && (
          <div className="absolute top-1/2 -right-36 -translate-y-1/2 z-50 pointer-events-none bg-white text-[#37352F] text-[11px] px-3 py-2 rounded-md border border-[#E9E9E7] shadow-sm animate-fadeIn flex flex-col gap-1">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-semibold text-[#37352F]">Close</span>
              <span className="text-[#787774] text-[10px]">Click or Ctrl+\</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-semibold text-[#37352F]">Resize</span>
              <span className="text-[#787774] text-[10px]">Drag</span>
            </div>
          </div>
        )}
      </aside>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  )
}

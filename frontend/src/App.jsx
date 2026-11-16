import { useState, useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import Sidebar from './components/Sidebar'
import CommandPalette from './components/CommandPalette'

// Pages
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'

// Feature cards
import GitHubCard from './components/GitHubCard'
import SkillScoresCard from './components/SkillScoresCard'
import SkillGapCard from './components/SkillGapCard'
import RoadmapCard from './components/RoadmapCard'
import ResourcesCard from './components/ResourcesCard'
import ProjectsCard from './components/ProjectsCard'
import ProgressDashboardCard from './components/ProgressDashboardCard'
import AdaptiveLoopCard from './components/AdaptiveLoopCard'
import MentorChatCard from './components/MentorChatCard'
import ResumeAnalyzerCard from './components/ResumeAnalyzerCard'

// ─── Responsive Page Wrapper Shell ─────────────────────
function PageShell({ title, subtitle, children }) {
  const { theme } = useTheme()
  return (
    <div className="space-y-6 w-full animate-fadeIn">
      {title && (
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-1 opacity-70">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}

// ─── Main App Layout ────────────────────────────────────
function AppLayout() {
  const [activePage, setActivePage] = useState('home')
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  )

  const { theme, settings, t } = useTheme()

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const currentSidebarWidth = settings.sidebarCollapsed ? 64 : (settings.sidebarWidth || 260)
  const effectiveMarginLeft = isMobile ? 0 : currentSidebarWidth

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage onNavigate={setActivePage} />

      case 'progress':
        return (
          <PageShell title="Progress Dashboard" subtitle="Unified view of your learning journey & skill metrics">
            <ProgressDashboardCard />
          </PageShell>
        )

      case 'github':
        return (
          <PageShell title="GitHub Integration" subtitle="Connect and analyze your public repositories & commit velocity">
            <GitHubCard />
          </PageShell>
        )

      case 'skills':
        return (
          <PageShell title="Skill Scores" subtitle="Deterministic scoring from verified GitHub activity & baseline quiz">
            <SkillScoresCard />
          </PageShell>
        )

      case 'gaps':
        return (
          <PageShell title="Skill Gap Analysis" subtitle="Compare your skills against career target profiles & ranked shortfalls">
            <SkillGapCard />
          </PageShell>
        )

      case 'resume':
        return (
          <PageShell title="Resume vs GitHub Matcher" subtitle="Check claimed resume skills against verified code activity for interview defense">
            <ResumeAnalyzerCard />
          </PageShell>
        )

      case 'roadmap':
        return (
          <PageShell title="AI Learning Roadmap" subtitle="Personalized week-by-week study plan with structured tasks & milestones">
            <RoadmapCard />
          </PageShell>
        )

      case 'resources':
        return (
          <PageShell title="Learning Resources" subtitle="Curated free docs, videos, and courses matched to your skill gaps">
            <ResourcesCard />
          </PageShell>
        )

      case 'projects':
        return (
          <PageShell title="Project Recommendations" subtitle="Portfolio projects matched to your current + stretch skills">
            <ProjectsCard />
          </PageShell>
        )

      case 'mentor':
        return (
          <PageShell title="AI Mentor" subtitle="Context-aware coaching grounded strictly in your real learning data">
            <MentorChatCard />
          </PageShell>
        )

      case 'growth':
        return (
          <PageShell title="Growth Tracker" subtitle="Re-scan GitHub on-demand to track score improvements over time">
            <AdaptiveLoopCard />
          </PageShell>
        )

      case 'settings':
        return <SettingsPage />

      default:
        return <HomePage onNavigate={setActivePage} />
    }
  }

  return (
    <div
      className="min-h-screen flex w-full overflow-x-hidden"
      style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
    >
      {/* Sidebar with Draggable Notion-Style Resizer */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onOpenCommandPalette={() => setIsPaletteOpen(true)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <main
        className="flex-1 min-h-screen flex flex-col transition-all duration-200 w-full"
        style={{ marginLeft: effectiveMarginLeft }}
      >
        {/* Top Header Bar */}
        <header
          className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 sm:px-6 md:px-8 border-b backdrop-blur-md"
          style={{
            backgroundColor: 'var(--bg-sidebar)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg border border-[#30363d] hover:bg-white/5 md:hidden text-slate-300"
              title="Open Navigation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono opacity-60 hidden sm:inline">
                SkillForge AI
              </span>
              <span className="opacity-40 hidden sm:inline">/</span>
              <span className="text-xs font-semibold capitalize tracking-wide">
                {t(activePage, activePage === 'home' ? 'Dashboard' : activePage.replace(/_/g, ' '))}
              </span>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-2.5">
            {/* Command Palette Trigger */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#30363d] bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05] transition-all cursor-pointer shadow-xs"
            >
              <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs opacity-75 hidden sm:inline">
                {t('searchOrAsk', 'Search or ask…')}
              </span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-[#30363d] opacity-75 font-mono">
                Ctrl+K
              </kbd>
            </button>

            {/* Quick Settings Icon */}
            <button
              onClick={() => setActivePage('settings')}
              className="w-8 h-8 rounded-xl border border-[#30363d] hover:bg-white/5 flex items-center justify-center text-xs opacity-80 hover:opacity-100 transition-all cursor-pointer"
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </header>

        {/* Fluid Responsive Page Canvas */}
        <div className="flex-1 w-full max-w-[1550px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-6 md:py-8">
          {renderPage()}
        </div>
      </main>

      {/* Global Spotlight Command Palette */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onSelect={(id) => {
          if (id === '__TOGGLE_PALETTE__') {
            setIsPaletteOpen((prev) => !prev)
          } else {
            setActivePage(id)
          }
        }}
      />
    </div>
  )
}

// ─── Root App with Context Providers ────────────────────
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    </AuthProvider>
  )
}

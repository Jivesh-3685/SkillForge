import { useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import Sidebar from './components/Sidebar'
import CommandPalette from './components/CommandPalette'

// Pages
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'

// Existing feature cards (used inline on their respective pages)
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

// ─── Page wrapper for feature cards ─────────────────────
function PageShell({ title, subtitle, children }) {
  const { theme } = useTheme()
  return (
    <div className="space-y-6">
      {title && (
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${theme.text}`}>{title}</h1>
          {subtitle && <p className={`text-sm mt-1 ${theme.textMuted}`}>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

// ─── Main App Layout ────────────────────────────────────
function AppLayout() {
  const [activePage, setActivePage] = useState('home')
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const { theme, settings } = useTheme()
  const sidebarWidth = settings.sidebarCollapsed ? 64 : 260

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HomePage onNavigate={setActivePage} />

      case 'progress':
        return (
          <PageShell title="Progress Dashboard" subtitle="Unified view of your learning journey">
            <ProgressDashboardCard />
          </PageShell>
        )

      case 'github':
        return (
          <PageShell title="GitHub Integration" subtitle="Connect and analyze your public coding activity">
            <GitHubCard />
          </PageShell>
        )

      case 'skills':
        return (
          <PageShell title="Skill Scores" subtitle="Deterministic scoring from verified GitHub activity">
            <SkillScoresCard />
          </PageShell>
        )

      case 'gaps':
        return (
          <PageShell title="Skill Gap Analysis" subtitle="Compare your skills against career target profiles">
            <SkillGapCard />
          </PageShell>
        )

      case 'resume':
        return (
          <PageShell title="Resume vs GitHub Matcher" subtitle="Check claimed resume skills against verified code activity">
            <ResumeAnalyzerCard />
          </PageShell>
        )

      case 'roadmap':
        return (
          <PageShell title="AI Learning Roadmap" subtitle="Personalized week-by-week study plan with AI + fallback engine">
            <RoadmapCard />
          </PageShell>
        )

      case 'resources':
        return (
          <PageShell title="Learning Resources" subtitle="Curated free docs, videos, and courses for your skill gaps">
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
          <PageShell title="AI Mentor" subtitle="Context-aware coaching grounded in your real data">
            <MentorChatCard />
          </PageShell>
        )

      case 'growth':
        return (
          <PageShell title="Growth Tracker" subtitle="Re-scan GitHub to track skill score changes over time">
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
    <div className={`min-h-screen ${theme.bg} ${theme.text} flex`}>
      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onOpenCommandPalette={() => setIsPaletteOpen(true)}
      />

      {/* Main Content */}
      <main
        className="flex-1 min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Top Bar (breadcrumb / search placeholder) */}
        <header className={`sticky top-0 z-30 h-12 flex items-center px-6 border-b ${theme.border} ${theme.sidebar} backdrop-blur-md`}>
          <div className="flex items-center gap-2 flex-1">
            <span className={`text-xs font-mono ${theme.textMuted}`}>
              SkillForge AI
            </span>
            <span className={`${theme.textMuted}`}>/</span>
            <span className={`text-xs font-semibold capitalize ${theme.text}`}>
              {activePage === 'home' ? 'Dashboard' : activePage.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Search pill */}
          <button
            onClick={() => setIsPaletteOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${theme.border} hover:border-white/20 transition-colors cursor-pointer`}
          >
            <svg className="w-3.5 h-3.5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className={`text-xs ${theme.textMuted}`}>Search or ask…</span>
            <kbd className={`text-[10px] px-1.5 py-0.5 rounded border ${theme.border} ${theme.textMuted} font-mono`}>
              Ctrl+K
            </kbd>
          </button>
        </header>

        {/* Page Content */}
        <div className="p-6 md:p-8 max-w-5xl">
          {renderPage()}
        </div>
      </main>

      {/* Global Command Palette */}
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

// ─── Root App with Providers ────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    </AuthProvider>
  )
}

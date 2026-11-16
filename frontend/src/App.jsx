import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import AuthModal from './components/AuthModal'
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

const API_URL = import.meta.env.VITE_API_URL || ''

function StatusDot({ ok, label }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-2.5 w-2.5 rounded-full ${
          ok === null
            ? 'bg-gray-400 animate-pulse'
            : ok
              ? 'bg-emerald-500'
              : 'bg-red-500'
        }`}
      />
      <span className="text-sm text-gray-300">{label}</span>
      <span className="ml-auto text-xs font-mono text-gray-400">
        {ok === null ? 'checking…' : ok ? 'ok' : 'error'}
      </span>
    </div>
  )
}

function MainDashboard() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const { currentUser, userProfile, loading: authLoading } = useAuth()

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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-10 space-y-8">
        {/* Phase Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-900">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Phase 11 & FR-10 — Complete Production Suite
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              SkillForge AI Workspace
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              GitHub-verified AI mentor for personalized skill roadmaps
            </p>
          </div>

          {!currentUser && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 cursor-pointer self-start md:self-auto"
            >
              Sign In / Register
            </button>
          )}
        </div>

        {/* User Authentication Card (Phase 1) */}
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              User Profile (MongoDB Synchronized)
            </h2>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300">
              {currentUser ? 'Authenticated' : 'Guest'}
            </span>
          </div>

          {authLoading ? (
            <div className="py-6 text-center text-sm text-gray-500 animate-pulse">
              Verifying authentication status…
            </div>
          ) : currentUser ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-gray-950 border border-gray-800">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-14 h-14 rounded-full border-2 border-emerald-500/50 object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-300 flex items-center justify-center font-bold text-xl uppercase">
                    {(currentUser.displayName || currentUser.email || 'U')[0]}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {userProfile?.display_name || currentUser.displayName || 'Learner'}
                  </h3>
                  <p className="text-sm text-gray-400">{currentUser.email}</p>
                  <p className="text-xs font-mono text-gray-500 mt-1">
                    Firebase UID: <span className="text-gray-300">{currentUser.uid}</span>
                  </p>
                  {userProfile?._id && (
                    <p className="text-xs font-mono text-emerald-400 mt-0.5">
                      ✓ MongoDB Document ID: {userProfile._id}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 px-4">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gray-800/80 flex items-center justify-center text-gray-400 mb-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white">Sign in to your account</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto mt-1 mb-5">
                Sign in with Google or Email to link your learning profile and access your verified skill roadmap.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>

        {/* Phase 8: Comprehensive Progress Dashboard Card */}
        <ProgressDashboardCard />

        {/* Phase 2: GitHub Integration Card */}
        <GitHubCard />

        {/* Phase 3: Skill Scores Card */}
        <SkillScoresCard />

        {/* Phase 4: Skill Gap Card */}
        <SkillGapCard />

        {/* Phase 5: AI Roadmap Card */}
        <RoadmapCard />

        {/* Phase 6: Resource Recommendation Card */}
        <ResourcesCard />

        {/* Phase 7: Project Recommendation Card */}
        <ProjectsCard />

        {/* Phase 9: Adaptive Loop & Skill Growth Tracking Card */}
        <AdaptiveLoopCard />

        {/* Phase 10: Grounded AI Mentor Card */}
        <MentorChatCard />

        {/* FR-10: Resume vs GitHub Matcher Card */}
        <ResumeAnalyzerCard />

        {/* Phase 0 System Health Card */}
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
              System Infrastructure Health
            </h2>
            <span className="text-xs font-mono text-gray-500">v0.1.0</span>
          </div>

          <div className="space-y-3">
            <StatusDot ok={health?.backend ?? null} label="Backend (FastAPI)" />
            <StatusDot ok={health?.database ?? null} label="Database (MongoDB Atlas)" />
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300">
              Connection error: {error}
            </div>
          )}
        </div>
      </main>

      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  )
}

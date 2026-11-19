import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import UserAvatar from './UserAvatar'

export default function Navbar() {
  const [modalOpen, setModalOpen] = useState(false)
  const { currentUser, userProfile, logout } = useAuth()

  return (
    <>
      <header className="border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-white tracking-tight">
              SkillForge <span className="text-emerald-400 font-mono text-sm font-normal">AI</span>
            </span>
          </div>

          {/* User Controls */}
          <div>
            {currentUser ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <UserAvatar user={currentUser} size="md" />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-200 leading-tight">
                      {userProfile?.display_name || currentUser.displayName || 'Learner'}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 text-sm font-semibold text-gray-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-xs hover:shadow-emerald-500/20 cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}

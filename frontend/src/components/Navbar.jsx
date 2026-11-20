import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import UserAvatar from './UserAvatar'

export default function Navbar() {
  const [modalOpen, setModalOpen] = useState(false)
  const { currentUser, userProfile, logout } = useAuth()

  return (
    <>
      <header className="border-b border-[#E9E9E7] bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md p-0.5 flex items-center justify-center bg-white border border-[#E9E9E7]">
              <img
                src="/logo.png"
                alt="SkillForge Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-semibold text-sm text-[#37352F] tracking-tight">
              SkillForge <span className="text-[#2383E2] font-mono text-xs font-normal">AI</span>
            </span>
          </div>

          {/* User Controls */}
          <div>
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <UserAvatar user={currentUser} size="sm" />
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-medium text-[#37352F] leading-tight">
                      {userProfile?.display_name || currentUser.displayName || 'Learner'}
                    </p>
                    <p className="text-[10px] text-[#787774]">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="px-2.5 py-1 text-xs font-medium text-[#787774] hover:text-[#37352F] hover:bg-[rgba(55,53,47,0.06)] rounded-md border border-[#E9E9E7] transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-[#2383E2] hover:bg-[#1b6ec2] rounded-md transition-colors cursor-pointer"
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

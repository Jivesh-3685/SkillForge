import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal({ isOpen, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth()

  if (!isOpen) return null

  const handleGoogleSignIn = async () => {
    try {
      setError('')
      setLoading(true)
      await loginWithGoogle()
      onClose()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        await signupWithEmail(email, password)
      } else {
        await loginWithEmail(email, password)
      }
      onClose()
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.')
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.')
      } else {
        setError(err.message || 'Authentication failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-[#E9E9E7] rounded-lg p-6 shadow-sm text-[#37352F]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#787774] hover:text-[#37352F] hover:bg-[rgba(55,53,47,0.06)] rounded p-1 transition-colors"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-md bg-[#F7F7F5] border border-[#E9E9E7] p-1.5 mb-2.5">
            <img
              src="/logo.png"
              alt="SkillForge"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-lg font-semibold tracking-tight text-[#37352F]">
            {isSignUp ? 'Create your SkillForge account' : 'Welcome back to SkillForge'}
          </h2>
          <p className="text-xs text-[#787774] mt-1">
            {isSignUp
              ? 'Start turning your code into verified skill roadmaps'
              : 'Sign in to access your skills and roadmaps'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-2.5 bg-[#FFE2DD] border border-[#E9E9E7] rounded-md text-xs text-[#5d1715]">
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="w-full flex items-center justify-center gap-2.5 py-2 px-3.5 bg-[#F7F7F5] hover:bg-[rgba(55,53,47,0.06)] border border-[#E9E9E7] rounded-md font-medium text-xs text-[#37352F] transition-colors cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-[#E9E9E7]"></div>
          <span className="px-3 text-[10px] text-[#787774] uppercase tracking-wider">or email</span>
          <div className="flex-1 border-t border-[#E9E9E7]"></div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-[#37352F] mb-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E9E9E7] rounded-md text-xs text-[#37352F] focus:border-[#2383E2] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#37352F] mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-[#F7F7F5] border border-[#E9E9E7] rounded-md text-xs text-[#37352F] focus:border-[#2383E2] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[#2383E2] hover:bg-[#1b6ec2] text-white font-medium rounded-md text-xs transition-colors cursor-pointer disabled:opacity-50 mt-1"
          >
            {loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </button>
        </form>

        {/* Switch Sign In / Sign Up */}
        <div className="text-center mt-4 text-xs text-[#787774]">
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false)
                  setError('')
                }}
                className="text-[#2383E2] hover:underline font-medium ml-0.5 cursor-pointer"
              >
                Sign in
              </button>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true)
                  setError('')
                }}
                className="text-[#2383E2] hover:underline font-medium ml-0.5 cursor-pointer"
              >
                Create one
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

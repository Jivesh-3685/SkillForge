import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function GitHubCard() {
  const { currentUser, apiFetch } = useAuth()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [rescanning, setRescanning] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const fetchStatus = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await apiFetch('/api/github/status')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      } else {
        setError('Failed to load GitHub status.')
      }
    } catch {
      setError('Network error while checking GitHub status.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchStatus()
    }
  }, [currentUser])

  // Check URL params for OAuth callback status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const githubStatus = params.get('github')
    const username = params.get('username')

    if (githubStatus === 'connected') {
      setNotice(`✓ Successfully connected GitHub account @${username || ''}!`)
      // Clean up URL without reload
      window.history.replaceState({}, document.title, window.location.pathname)
      fetchStatus()
    } else if (githubStatus === 'error') {
      const reason = params.get('reason') || 'Authentication failed'
      setError(`GitHub connection failed: ${reason}`)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleConnect = async () => {
    try {
      setConnecting(true)
      setError('')
      const res = await apiFetch('/api/github/auth-url')
      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
        } else {
          setError('Could not generate GitHub authorization URL.')
        }
      } else {
        setError('Failed to initiate GitHub OAuth.')
      }
    } catch {
      setError('Network error while initiating GitHub connection.')
    } finally {
      setConnecting(false)
    }
  }

  const handleRescan = async () => {
    try {
      setRescanning(true)
      setError('')
      setNotice('')
      const res = await apiFetch('/api/github/rescan', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setNotice(`✓ Re-scanned ${data.repository_count} repositories and ${data.commit_count} commits.`)
        await fetchStatus()
      } else {
        const data = await res.json()
        setError(data.detail || 'Re-scan failed.')
      }
    } catch {
      setError('Network error while re-scanning GitHub.')
    } finally {
      setRescanning(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your GitHub account?')) return
    try {
      setLoading(true)
      const res = await apiFetch('/api/github/disconnect', { method: 'POST' })
      if (res.ok) {
        setNotice('GitHub account disconnected.')
        setStatus({ connected: false })
      } else {
        setError('Failed to disconnect GitHub.')
      }
    } catch {
      setError('Network error while disconnecting GitHub.')
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) return null

  const analysis = status?.analysis

  return (
    <div className="bg-white border border-[#E9E9E7] rounded-md p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#37352F] flex items-center gap-2.5">
            <svg className="w-5 h-5 text-[#37352F]" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            GitHub Activity & Evidence
          </h2>
        </div>

        {status?.connected && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleRescan}
              disabled={rescanning}
              className="px-3 py-1.5 text-xs font-medium bg-[#F7F7F5] hover:bg-[rgba(55,53,47,0.06)] text-[#37352F] border border-[#E9E9E7] rounded-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {rescanning ? (
                <>
                  <span className="w-3 h-3 border-2 border-[#2383E2] border-t-transparent rounded-full animate-spin"></span>
                  Re-scanning…
                </>
              ) : (
                '↻ Re-scan'
              )}
            </button>
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 text-xs font-medium text-[#5d1715] hover:bg-[#FFE2DD] border border-[#E9E9E7] rounded-md transition-colors cursor-pointer"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      {notice && (
        <div className="p-3 bg-[#DBEDDB] border border-[#E9E9E7] rounded-md text-xs text-[#1c3829] flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-[#1c3829] hover:opacity-80 ml-2">✕</button>
        </div>
      )}
      {error && (
        <div className="p-3 bg-[#FFE2DD] border border-[#E9E9E7] rounded-md text-xs text-[#5d1715] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-[#5d1715] hover:opacity-80 ml-2">✕</button>
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-[#787774] animate-pulse">
          Checking GitHub status…
        </div>
      ) : !status?.connected ? (
        /* Not Connected State */
        <div className="p-6 rounded-md bg-[#F7F7F5] border border-[#E9E9E7] text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-md bg-white border border-[#E9E9E7] flex items-center justify-center text-[#37352F]">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#37352F]">Connect your GitHub profile</h3>
            <p className="text-xs text-[#787774] max-w-md mx-auto mt-1">
              SkillForge reads your public repositories, languages, and commit counts to measure verified skills. We request only read-only public access — never write permissions.
            </p>
          </div>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2383E2] hover:bg-[#1b6ec2] text-white font-medium rounded-md text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {connecting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Redirecting to GitHub…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                Connect with GitHub
              </>
            )}
          </button>
        </div>
      ) : (
        /* Connected & Analyzed State */
        <div className="space-y-5">
          {/* Summary Banner */}
          <div className="p-4 rounded-md bg-[#F7F7F5] border border-[#E9E9E7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#D3E5EF] text-[#183347] font-semibold text-xs flex items-center justify-center">
                GH
              </div>
              <div>
                <a
                  href={`https://github.com/${status.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-[#37352F] hover:text-[#2383E2] transition-colors flex items-center gap-1.5"
                >
                  @{status.username}
                  <span className="text-xs text-[#787774] font-normal">↗</span>
                </a>
                <p className="text-[11px] text-[#787774]">
                  Connected account • Scanned {analysis?.scanned_at ? new Date(analysis.scanned_at).toLocaleTimeString() : 'recently'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="px-3 py-1 rounded-md bg-white border border-[#E9E9E7]">
                <span className="text-[#787774] block text-[10px] uppercase">Repos</span>
                <span className="text-[#37352F] font-semibold text-sm">{analysis?.repo_count ?? 0}</span>
              </div>
              <div className="px-3 py-1 rounded-md bg-white border border-[#E9E9E7]">
                <span className="text-[#787774] block text-[10px] uppercase">Commits</span>
                <span className="text-[#37352F] font-semibold text-sm">{analysis?.total_commits ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Languages Breakdown */}
          {analysis?.languages && analysis.languages.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#787774]">
                Detected Languages & Code Volume
              </h3>
              
              {/* Stacked Bar */}
              <div className="h-2.5 w-full bg-[#E9E9E7] rounded-full overflow-hidden flex">
                {analysis.languages.slice(0, 5).map((l, i) => {
                  const colors = ['bg-[#2383E2]', 'bg-[#10b981]', 'bg-[#f59e0b]', 'bg-[#8b5cf6]', 'bg-[#ec4899]']
                  return (
                    <div
                      key={l.language}
                      style={{ width: `${l.percentage}%` }}
                      className={`${colors[i % colors.length]} transition-all`}
                      title={`${l.language}: ${l.percentage}%`}
                    />
                  )
                })}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {analysis.languages.slice(0, 8).map((l, i) => {
                  const dotColors = ['bg-[#2383E2]', 'bg-[#10b981]', 'bg-[#f59e0b]', 'bg-[#8b5cf6]', 'bg-[#ec4899]', 'bg-[#787774]']
                  return (
                    <span
                      key={l.language}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E9E9E7] text-xs text-[#37352F]"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[i % dotColors.length]}`}></span>
                      <span className="font-medium text-xs">{l.language}</span>
                      <span className="text-[#787774] font-mono text-[10px]">{l.percentage}%</span>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent Repositories */}
          {analysis?.repositories && analysis.repositories.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#787774]">
                Sample Scanned Repositories ({analysis.repositories.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.repositories.slice(0, 6).map((repo) => (
                  <div
                    key={repo.id}
                    className="p-3.5 rounded-md bg-white border border-[#E9E9E7] hover:bg-[rgba(55,53,47,0.02)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-[#37352F] hover:text-[#2383E2] truncate max-w-[200px]"
                      >
                        {repo.name}
                      </a>
                      <span className="text-[11px] font-mono text-[#787774]">
                        {repo.commits} commits
                      </span>
                    </div>
                    {repo.description && (
                      <p className="text-xs text-[#787774] mt-1 line-clamp-1">{repo.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[#787774] font-mono">
                      {repo.primary_language && (
                        <span className="text-[#2383E2]">{repo.primary_language}</span>
                      )}
                      {repo.stars > 0 && <span>★ {repo.stars}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useAuth } from '../context/AuthContext'

const LINE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

export default function AdaptiveLoopCard() {
  const { idToken, currentUser } = useAuth()
  const [history, setHistory] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const fetchHistory = useCallback(async () => {
    if (!idToken) return
    try {
      setLoading(true)
      const res = await fetch('/api/skills/history', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (err) {
      setError('Failed to fetch skill growth history.')
    } finally {
      setLoading(false)
    }
  }, [idToken])

  useEffect(() => {
    if (idToken) {
      fetchHistory()
    }
  }, [idToken, fetchHistory])

  const handleRescan = async () => {
    if (!idToken) return
    try {
      setError('')
      setNotice('')
      setScanning(true)
      const res = await fetch('/api/github/rescan?force=true', {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Re-scan failed')
      }
      const data = await res.json()
      setNotice('GitHub scan complete! Scores and deltas updated.')
      await fetchHistory()
    } catch (err) {
      setError(err.message)
    } finally {
      setScanning(false)
    }
  }

  if (!currentUser) return null

  const timeline = history?.timeline || []
  const trackedSkills = history?.tracked_skills || []
  const latestDeltas = (history?.latest_deltas || []).filter((d) => d.delta !== 0)

  return (
    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
            Phase 9: Re-scan & Adaptive Loop (FR-11)
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Adaptive Learning Loop & Skill Growth
          </h2>
        </div>

        <button
          onClick={handleRescan}
          disabled={scanning}
          className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-2 self-start sm:self-auto"
        >
          {scanning ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></span>
              Scanning GitHub…
            </>
          ) : (
            '↻ Re-Scan for New Commits'
          )}
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-emerald-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Latest Deltas Banner */}
      {latestDeltas.length > 0 && (
        <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Latest Scan Score Deltas
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              {latestDeltas.length} skill changes detected
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {latestDeltas.slice(0, 6).map((d) => {
              const isPositive = d.delta > 0
              return (
                <div
                  key={d.skill_id}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
                    isPositive
                      ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300'
                      : 'bg-red-950/30 border-red-800/50 text-red-300'
                  }`}
                >
                  <span className="font-bold text-white">{d.name}:</span>
                  <span>{d.previous_score}% → {d.new_score}%</span>
                  <strong className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                    ({isPositive ? `+${d.delta}%` : `${d.delta}%`})
                  </strong>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Growth Timeline Chart */}
      <div className="p-5 rounded-xl bg-gray-950/90 border border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Skill Growth Over Scans
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Historical progression recorded across append-only scan versions.
            </p>
          </div>
          <span className="text-xs font-mono text-gray-500">
            {timeline.length} scan{timeline.length === 1 ? '' : 's'} on record
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500 animate-pulse">
            Loading growth timeline…
          </div>
        ) : timeline.length > 1 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#030712',
                    borderColor: '#374151',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {trackedSkills.slice(0, 5).map((skillName, idx) => (
                  <Line
                    key={skillName}
                    type="monotone"
                    dataKey={skillName}
                    stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-gray-500 space-y-2">
            <p>1 initial scan point recorded.</p>
            <p className="text-gray-400">
              Commit code to your public GitHub repos, then click <strong>"↻ Re-Scan for New Commits"</strong> above to see your skills trend upward over time!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

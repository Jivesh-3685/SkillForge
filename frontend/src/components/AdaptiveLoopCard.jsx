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

const LINE_COLORS = ['#2383E2', '#0F7B6C', '#D9730D', '#6940A5', '#DF5452', '#0B6E99']

export default function AdaptiveLoopCard() {
  const { currentUser, apiFetch } = useAuth()
  const [history, setHistory] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const fetchHistory = useCallback(async () => {
    if (!currentUser) return
    try {
      setLoading(true)
      const res = await apiFetch('/api/skills/history')
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (err) {
      setError('Failed to fetch skill growth history.')
    } finally {
      setLoading(false)
    }
  }, [currentUser, apiFetch])

  useEffect(() => {
    if (currentUser) {
      fetchHistory()
    }
  }, [currentUser, fetchHistory])

  const handleRescan = async () => {
    if (!currentUser) return
    try {
      setError('')
      setNotice('')
      setScanning(true)
      const res = await apiFetch('/api/github/rescan?force=true', {
        method: 'POST',
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Re-scan failed')
      }
      await res.json()
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
    <div className="bg-white border border-[#E9E9E7] rounded-md p-6 shadow-none space-y-6 text-[#37352F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E9E9E7]">
        <div>
          <h2 className="text-base font-semibold text-[#37352F] flex items-center gap-2">
            <svg className="w-4 h-4 text-[#2383E2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Adaptive Learning Loop & Skill Growth
          </h2>
          <p className="text-xs text-[#787774] mt-0.5">
            Continuous verification loop tracking skills across your latest commits.
          </p>
        </div>

        <button
          onClick={handleRescan}
          disabled={scanning}
          className="px-3.5 py-1.5 text-xs font-medium bg-[#2383E2] hover:bg-[#1d6fc2] text-white rounded-md transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 self-start sm:self-auto"
        >
          {scanning ? (
            <>
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Scanning GitHub…
            </>
          ) : (
            '↻ Re-Scan for New Commits'
          )}
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-[#DBEDDB] border border-[#c2e2c2] rounded-md text-xs text-[#1c3829] flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-[#1c3829] hover:opacity-70 ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#FFE2DD] border border-[#f5c6cb] rounded-md text-xs text-[#5d1715] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-[#5d1715] hover:opacity-70 ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* Latest Deltas Banner */}
      {latestDeltas.length > 0 && (
        <div className="p-4 rounded-md bg-[#F7F7F5] border border-[#E9E9E7] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774]">
              Latest Scan Score Deltas
            </span>
            <span className="text-[11px] font-mono text-[#0F7B6C] font-semibold">
              {latestDeltas.length} skill changes detected
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {latestDeltas.slice(0, 6).map((d) => {
              const isPositive = d.delta > 0
              return (
                <div
                  key={d.skill_id}
                  className={`px-2.5 py-1 rounded-md border text-xs font-mono flex items-center gap-2 ${
                    isPositive
                      ? 'bg-[#DBEDDB] border-[#c2e2c2] text-[#1c3829]'
                      : 'bg-[#FFE2DD] border-[#f5c6cb] text-[#5d1715]'
                  }`}
                >
                  <span className="font-semibold text-[#37352F]">{d.name}:</span>
                  <span>{d.previous_score}% → {d.new_score}%</span>
                  <strong>
                    ({isPositive ? `+${d.delta}%` : `${d.delta}%`})
                  </strong>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Growth Timeline Chart */}
      <div className="p-5 rounded-md bg-[#F7F7F5] border border-[#E9E9E7] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#37352F] flex items-center gap-1.5">
              <span>📈</span> Skill Growth Over Scans
            </h3>
            <p className="text-[11px] text-[#787774] mt-0.5">
              Historical progression recorded across append-only scan versions.
            </p>
          </div>
          <span className="text-xs font-mono text-[#787774]">
            {timeline.length} scan{timeline.length === 1 ? '' : 's'} on record
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[#787774] animate-pulse">
            Loading growth timeline…
          </div>
        ) : timeline.length > 1 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 15, right: 20, left: 10, bottom: 15 }}>
                <XAxis dataKey="date" stroke="#787774" fontSize={11} tickLine={false} />
                <YAxis stroke="#787774" fontSize={11} domain={[0, 100]} width={35} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E9E9E7',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#37352F',
                    boxShadow: 'none',
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
          <div className="py-10 text-center text-xs text-[#787774] space-y-1.5">
            <p>1 initial scan point recorded.</p>
            <p className="text-[#787774]">
              Commit code to your public GitHub repos, then click <strong>"↻ Re-Scan for New Commits"</strong> above to see your skills trend upward over time!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

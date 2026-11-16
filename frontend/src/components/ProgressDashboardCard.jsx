import { useState, useEffect, useCallback } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useAuth } from '../context/AuthContext'

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280']

export default function ProgressDashboardCard() {
  const { idToken, currentUser } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchProgress = useCallback(async () => {
    if (!idToken) return
    try {
      setLoading(true)
      const res = await fetch('/api/progress', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (err) {
      setError('Failed to fetch aggregate progress.')
    } finally {
      setLoading(false)
    }
  }, [idToken])

  useEffect(() => {
    if (idToken) {
      fetchProgress()
    }
  }, [idToken, fetchProgress])

  if (!currentUser) return null

  const roadmap = data?.roadmap
  const projects = data?.projects
  const github = data?.github
  const skillChartData = data?.chart_data?.skills || []
  const languagePieData = data?.chart_data?.languages || []

  return (
    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 backdrop-blur-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
            Phase 8: Progress Dashboard (FR-08)
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Comprehensive Growth & Progress
          </h2>
        </div>

        <button
          onClick={fetchProgress}
          className="text-xs font-mono text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 transition-colors cursor-pointer self-start sm:self-auto"
        >
          ↻ Refresh Metrics
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500 animate-pulse">
          Aggregating verified metrics & charts…
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* 1. Career Match */}
            <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 space-y-1">
              <span className="text-[10px] uppercase font-mono text-gray-500">Target Readiness</span>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                {data?.match_readiness_percentage ?? 0}%
              </div>
              <p className="text-[11px] text-gray-400 truncate">{data?.career_title}</p>
            </div>

            {/* 2. Roadmap Completed */}
            <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 space-y-1">
              <span className="text-[10px] uppercase font-mono text-gray-500">Roadmap Progress</span>
              <div className="text-2xl font-extrabold text-blue-400 font-mono">
                {roadmap?.percentage ?? 0}%
              </div>
              <p className="text-[11px] text-gray-400">
                {roadmap?.completed_tasks ?? 0}/{roadmap?.total_tasks ?? 0} tasks done
              </p>
            </div>

            {/* 3. Portfolio Projects */}
            <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 space-y-1">
              <span className="text-[10px] uppercase font-mono text-gray-500">Portfolio Work</span>
              <div className="text-2xl font-extrabold text-amber-400 font-mono">
                {projects?.completed ?? 0}
              </div>
              <p className="text-[11px] text-gray-400">
                {projects?.in_progress ?? 0} currently in progress
              </p>
            </div>

            {/* 4. GitHub Commits */}
            <div className="p-4 rounded-xl bg-gray-950/80 border border-gray-800 space-y-1">
              <span className="text-[10px] uppercase font-mono text-gray-500">Verified Activity</span>
              <div className="text-2xl font-extrabold text-purple-400 font-mono">
                {github?.total_commits ?? 0}
              </div>
              <p className="text-[11px] text-gray-400">
                commits in {github?.repo_count ?? 0} repos
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Bar Chart (Skills vs Target) */}
            <div className="lg:col-span-2 p-5 rounded-xl bg-gray-950/90 border border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Current Score vs Target Requirement
                </h3>
                <span className="text-[11px] font-mono text-gray-500">Top Career Skills</span>
              </div>

              {skillChartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                      <XAxis
                        dataKey="skill"
                        stroke="#6b7280"
                        fontSize={11}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
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
                      <Bar dataKey="current" name="Current Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="target" name="Target Requirement" fill="#374151" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-gray-500">
                  Select a career goal to visualize comparative skill analytics.
                </div>
              )}
            </div>

            {/* Right Col: Pie Chart (Language Breakdown) */}
            <div className="p-5 rounded-xl bg-gray-950/90 border border-gray-800 space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Language Distribution
                </h3>
                <span className="text-[11px] font-mono text-gray-500">Code Volume</span>
              </div>

              {languagePieData.length > 0 ? (
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={languagePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {languagePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => `${val}%`}
                        contentStyle={{
                          backgroundColor: '#030712',
                          borderColor: '#374151',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-gray-500">
                  Connect GitHub with code files to render language distribution.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

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
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { useAuth } from '../context/AuthContext'

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280']
const LINE_COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899', '#06b6d4']

function CustomScatterTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-[#030712] border border-[#374151] rounded-xl p-3 text-xs shadow-xl space-y-1.5 backdrop-blur-md">
        <p className="font-bold text-white text-sm flex items-center justify-between gap-3">
          <span>{data.name}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              data.status === 'Mastered'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : data.status === 'Critical Gap'
                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}
          >
            {data.status}
          </span>
        </p>
        <div className="flex items-center justify-between gap-4 text-slate-300">
          <span>Current Verified:</span>
          <span className="font-mono font-bold text-emerald-400">{data.current}%</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-300">
          <span>Target Required:</span>
          <span className="font-mono text-slate-300">{data.target}%</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-300">
          <span>Shortfall Gap:</span>
          <span className={`font-mono font-bold ${data.shortfall > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {data.shortfall > 0 ? `+${data.shortfall}%` : '0% (Met)'}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export default function ProgressDashboardCard() {
  const { currentUser, apiFetch } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchProgress = useCallback(async () => {
    if (!currentUser) return
    try {
      setLoading(true)
      const res = await apiFetch('/api/progress')
      if (res.ok) {
        const result = await res.json()
        setData(result)
      } else {
        setError('Failed to fetch aggregate progress.')
      }
    } catch (err) {
      setError('Unable to connect to progress service.')
    } finally {
      setLoading(false)
    }
  }, [currentUser, apiFetch])

  useEffect(() => {
    if (currentUser) {
      fetchProgress()
    }
  }, [currentUser, fetchProgress])

  if (!currentUser) return null

  const roadmap = data?.roadmap
  const projects = data?.projects
  const github = data?.github
  const skillChartData = data?.chart_data?.skills || []
  const languagePieData = data?.chart_data?.languages || []
  const scatterData = data?.chart_data?.scatter || []
  const timelineData = data?.chart_data?.timeline || []
  const trackedSkills = data?.chart_data?.tracked_skills || []

  // Split scatter data by status for distinct dot colors
  const masteredPoints = scatterData.filter((d) => d.status === 'Mastered')
  const moderatePoints = scatterData.filter((d) => d.status === 'Moderate Gap')
  const criticalPoints = scatterData.filter((d) => d.status === 'Critical Gap')

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 text-slate-100 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#30363d]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
            Phase 8: Progress Dashboard (FR-08)
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span>📈</span> Comprehensive Growth & Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time analytics comparing verified skills, historical progression, and target career benchmarks.
          </p>
        </div>

        <button
          onClick={fetchProgress}
          className="text-xs font-mono text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 border border-[#30363d] hover:bg-white/10 transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
        >
          <span>↻</span> Refresh Metrics
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-sm text-slate-500 animate-pulse">
          Aggregating verified metrics & rendering interactive charts…
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top 4 Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* 1. Career Match */}
            <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-400">Target Readiness</span>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">
                {data?.match_readiness_percentage ?? 0}%
              </div>
              <p className="text-[11px] text-slate-300 truncate">{data?.career_title}</p>
            </div>

            {/* 2. Roadmap Completed */}
            <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-400">Roadmap Progress</span>
              <div className="text-2xl font-extrabold text-blue-400 font-mono">
                {roadmap?.percentage ?? 0}%
              </div>
              <p className="text-[11px] text-slate-300">
                {roadmap?.completed_tasks ?? 0}/{roadmap?.total_tasks ?? 0} tasks done
              </p>
            </div>

            {/* 3. Portfolio Projects */}
            <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-400">Portfolio Work</span>
              <div className="text-2xl font-extrabold text-amber-400 font-mono">
                {projects?.completed ?? 0}
              </div>
              <p className="text-[11px] text-slate-300">
                {projects?.in_progress ?? 0} in progress
              </p>
            </div>

            {/* 4. GitHub Commits */}
            <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-1">
              <span className="text-[10px] uppercase font-mono text-slate-400">Verified Activity</span>
              <div className="text-2xl font-extrabold text-purple-400 font-mono">
                {github?.total_commits ?? 0}
              </div>
              <p className="text-[11px] text-slate-300">
                commits in {github?.repo_count ?? 0} repos
              </p>
            </div>
          </div>

          {/* ═══════════ NEW 1. LINE GRAPH (Skill Score Progression) ═══════════ */}
          <div className="p-5 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <span>📉</span> 1. Skill Score Progression Over Time (Line Graph)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Track skill velocity and growth trajectories across roadmap milestones and verified scans.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
                Velocity Curve
              </span>
            </div>

            {timelineData.length > 0 ? (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData} margin={{ top: 10, right: 20, left: -15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis
                      dataKey="label"
                      stroke="#8b949e"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis stroke="#8b949e" fontSize={11} domain={[0, 100]} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#030712',
                        borderColor: '#30363d',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    {trackedSkills.map((skillName, idx) => (
                      <Line
                        key={skillName}
                        type="monotone"
                        dataKey={skillName}
                        name={skillName}
                        stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                        strokeWidth={2.5}
                        dot={{ r: 4, strokeWidth: 2, fill: '#0d1117' }}
                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-500">
                Complete roadmap tasks or re-scan GitHub to populate skill progression trends.
              </div>
            )}
          </div>

          {/* ═══════════ NEW 2. SCATTER GRAPH (Current vs Target Matrix) ═══════════ */}
          <div className="p-5 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <span>🎯</span> 2. Skill Competency Matrix (Scatter Graph)
                </h3>
                <p className="text-[11px] text-slate-400">
                  X-Axis: Verified Score (0–100%) vs Y-Axis: Target Goal (0–100%). Points on or below the dashed line meet career requirements.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Mastered
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Moderate Gap
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Critical Gap
                </span>
              </div>
            </div>

            {scatterData.length > 0 ? (
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 15, right: 25, bottom: 20, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis
                      type="number"
                      dataKey="current"
                      name="Current Score"
                      unit="%"
                      domain={[0, 100]}
                      stroke="#8b949e"
                      fontSize={11}
                      label={{ value: 'Current Verified Score (%)', position: 'bottom', fill: '#8b949e', fontSize: 11, offset: 5 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="target"
                      name="Target Score"
                      unit="%"
                      domain={[0, 100]}
                      stroke="#8b949e"
                      fontSize={11}
                      label={{ value: 'Target Requirement (%)', angle: -90, position: 'left', fill: '#8b949e', fontSize: 11, offset: 15 }}
                    />
                    <ZAxis type="number" dataKey="shortfall" range={[80, 220]} />
                    <Tooltip content={<CustomScatterTooltip />} />
                    {/* Diagonal Reference Line: y = x */}
                    <ReferenceLine
                      segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
                      stroke="#484f58"
                      strokeDasharray="4 4"
                      label={{ value: 'Parity (y = x)', fill: '#6e7681', fontSize: 10, position: 'insideTopLeft' }}
                    />
                    <Scatter name="Mastered" data={masteredPoints} fill="#10b981" shape="circle" />
                    <Scatter name="Moderate Gap" data={moderatePoints} fill="#06b6d4" shape="circle" />
                    <Scatter name="Critical Gap" data={criticalPoints} fill="#f43f5e" shape="circle" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-500">
                Connect GitHub or take the cold-start quiz to plot skill distribution points.
              </div>
            )}
          </div>

          {/* Existing Bar Chart & Pie Chart Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Bar Chart (Skills vs Target) */}
            <div className="lg:col-span-2 p-5 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Target Benchmark Breakdown (Bar Chart)
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Active Career Goal</span>
              </div>

              {skillChartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                      <XAxis
                        dataKey="skill"
                        stroke="#8b949e"
                        fontSize={11}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
                      <YAxis stroke="#8b949e" fontSize={11} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#030712',
                          borderColor: '#30363d',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="current" name="Current Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="target" name="Target Requirement" fill="#30363d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-slate-500">
                  Select a career goal to visualize comparative skill analytics.
                </div>
              )}
            </div>

            {/* Right Col: Pie Chart (Language Breakdown) */}
            <div className="p-5 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Language Distribution
                </h3>
                <span className="text-[11px] font-mono text-slate-400">Code Volume</span>
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
                          borderColor: '#30363d',
                          borderRadius: '0.75rem',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-16 text-center text-xs text-slate-500">
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

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  AreaChart,
  Area,
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

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4']
const AREA_COLORS = ['#3b82f6', '#ec4899', '#10b981', '#8b5cf6']

// Custom Tooltip for Line & Area Charts
function CustomTrajectoryTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#030712]/95 border border-[#30363d] rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[160px] space-y-1.5 z-50 pointer-events-none">
        <p className="font-mono font-bold text-slate-200 text-xs border-b border-[#30363d]/70 pb-1">
          {label}
        </p>
        <div className="space-y-1">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold text-slate-100">{entry.value}%</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

// Custom Tooltip for Scatter Matrix
function CustomScatterTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-[#030712]/95 border border-[#30363d] rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[170px] space-y-1.5 z-50 pointer-events-none">
        <div className="flex items-center justify-between gap-2 border-b border-[#30363d]/70 pb-1">
          <span className="font-bold text-white text-xs">{data.name}</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
              data.status === 'Mastered'
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : data.status === 'Critical Gap'
                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                : 'bg-amber-950 text-amber-400 border border-amber-800'
            }`}
          >
            {data.status}
          </span>
        </div>
        <div className="space-y-1 font-mono text-xs">
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span className="text-slate-400">Verified:</span>
            <span className="font-bold text-emerald-400">{data.current}%</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span className="text-slate-400">Goal:</span>
            <span className="text-slate-200">{data.target}%</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-slate-300">
            <span className="text-slate-400">Shortfall:</span>
            <span className={`font-bold ${data.shortfall > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {data.shortfall > 0 ? `+${data.shortfall}%` : '0%'}
            </span>
          </div>
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

  // View state controls
  const [timeframe, setTimeframe] = useState('12m')
  const [allocationTab, setAllocationTab] = useState('all')
  const [viewMode, setViewMode] = useState('table') // 'table' | 'scatter'
  const [page, setPage] = useState(1)
  const itemsPerPage = 4

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

  const roadmap = data?.roadmap
  const projects = data?.projects
  const github = data?.github
  const skillChartData = data?.chart_data?.skills || []
  const languagePieData = data?.chart_data?.languages || []
  const scatterData = data?.chart_data?.scatter || []
  const timelineData = data?.chart_data?.timeline || []
  const trackedSkills = data?.chart_data?.tracked_skills || []

  // Group scatter points for clean styling
  const masteredPoints = scatterData.filter((d) => d.status === 'Mastered')
  const moderatePoints = scatterData.filter((d) => d.status === 'Moderate Gap')
  const criticalPoints = scatterData.filter((d) => d.status === 'Critical Gap')

  // Pagination for allocation table
  const totalPages = Math.ceil((scatterData.length || 1) / itemsPerPage)
  const paginatedSkills = useMemo(() => {
    const start = (page - 1) * itemsPerPage
    return scatterData.slice(start, start + itemsPerPage)
  }, [scatterData, page])

  // Mini sparkline mock trajectory generator
  const getSparklineData = (score) => [
    { v: Math.max(10, score - 20) },
    { v: Math.max(15, score - 15) },
    { v: Math.max(20, score - 8) },
    { v: score },
  ]

  if (!currentUser) return null

  return (
    <div className="space-y-6">
      {/* ═══════════ TOP BANNER (Executive Gradient Bar) ═══════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 p-4 sm:p-5 text-white shadow-xl">
        {/* Subtle background curved lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/20">
              📊
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Executive Progress & Performance
              </h1>
              <p className="text-xs text-indigo-100/80">
                Verified GitHub competencies, roadmap milestone pacing, and career goal benchmarks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 font-mono text-indigo-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {data?.career_title || 'Software Engineer'}
            </span>

            <button
              onClick={fetchProgress}
              disabled={loading}
              className="text-xs px-3.5 py-1.5 rounded-xl bg-white text-gray-950 font-bold hover:bg-indigo-50 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span>↻</span> Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-xs font-mono text-slate-500 animate-pulse">
          Aggregating verified learner metrics & preparing dashboard…
        </div>
      ) : (
        /* ═══════════ MAIN 2-COLUMN DASHBOARD GRID ═══════════ */
        <div className="grid grid-cols-12 gap-5">
          {/* ────────────────── LEFT COLUMN (8 / 12) ────────────────── */}
          <div className="col-span-12 xl:col-span-8 space-y-5">
            {/* 1. Large Trajectory Chart */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#30363d]/60 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-100 tracking-tight">
                    Skill Performance & Growth Trajectory
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Continuous velocity curve tracked across roadmap milestones.
                  </p>
                </div>

                {/* Timeframe pill tabs */}
                <div className="flex items-center bg-[#0d1117] p-1 rounded-xl border border-[#30363d] text-[11px] font-mono self-start sm:self-auto">
                  {[
                    { id: '12m', label: '12 months' },
                    { id: '30d', label: '30 days' },
                    { id: '7d', label: '7 days' },
                    { id: '24h', label: '24 hours' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setTimeframe(tab.id)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                        timeframe === tab.id
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area Chart Container */}
              <div className="h-72 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 15, right: 25, left: 10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="gradSecondary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                    <XAxis
                      dataKey="label"
                      stroke="#8b949e"
                      fontSize={11}
                      tickLine={false}
                      dy={8}
                    />
                    <YAxis
                      stroke="#8b949e"
                      fontSize={11}
                      domain={[0, 100]}
                      width={38}
                      unit="%"
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTrajectoryTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                    {trackedSkills.slice(0, 3).map((skillName, idx) => (
                      <Area
                        key={skillName}
                        type="monotone"
                        dataKey={skillName}
                        name={skillName}
                        stroke={AREA_COLORS[idx % AREA_COLORS.length]}
                        strokeWidth={2.5}
                        fill={idx === 0 ? 'url(#gradPrimary)' : idx === 1 ? 'url(#gradSecondary)' : 'transparent'}
                        dot={{ r: 3.5, strokeWidth: 2, fill: '#0d1117' }}
                        activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Three Middle Stat Cards (Language Donut, Sprint Days, Readiness Gauge) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card B1: Language Distribution */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Language Distribution
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Verified code share</p>
                </div>

                <div className="flex items-center gap-3 my-2">
                  <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={languagePieData.length > 0 ? languagePieData : [{ name: 'Code', value: 100 }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={44}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {(languagePieData.length > 0 ? languagePieData : [{ name: 'Code', value: 100 }]).map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex-1 space-y-1.5 min-w-0">
                    {languagePieData.slice(0, 3).map((lang, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-mono">
                        <span className="flex items-center gap-1.5 truncate text-slate-300">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                          />
                          {lang.name}
                        </span>
                        <span className="text-slate-400 font-bold">{lang.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#30363d]/60 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>{github?.repo_count ?? 0} repos scanned</span>
                  <span className="text-emerald-400">✓ Active</span>
                </div>
              </div>

              {/* Card B2: Roadmap Sprint Circular Ring */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Roadmap Milestone Sprint
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Execution pacing</p>
                </div>

                {/* Circular ring meter with centered text */}
                <div className="relative my-2 flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      stroke="#30363d"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={238.76}
                      strokeDashoffset={238.76 * (1 - (roadmap?.percentage ?? 0) / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xl font-extrabold text-white font-mono">
                      {roadmap?.percentage ?? 0}%
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Done</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#30363d]/60 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>{roadmap?.completed_tasks ?? 0}/{roadmap?.total_tasks ?? 0} tasks done</span>
                  <span className="text-blue-400">{roadmap?.total_hours ?? 0}h total</span>
                </div>
              </div>

              {/* Card B3: Target Readiness Semi-Circle Speedometer */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Target Career Readiness
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Verified benchmark match</p>
                </div>

                {/* Semi-circle Gauge */}
                <div className="relative my-2 flex flex-col items-center justify-center">
                  <svg className="w-28 h-16 overflow-hidden">
                    <path
                      d="M 10 56 A 46 46 0 0 1 102 56"
                      fill="none"
                      stroke="#30363d"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 10 56 A 46 46 0 0 1 102 56"
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="10"
                      strokeDasharray={144.5}
                      strokeDashoffset={144.5 * (1 - (data?.match_readiness_percentage ?? 0) / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center mt-1">
                    <span className="text-2xl font-black text-white font-mono">
                      {data?.match_readiness_percentage ?? 0}%
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#30363d]/60 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span className="truncate">{data?.career_title || 'Role'}</span>
                  <span className="text-rose-400 font-bold">Benchmark</span>
                </div>
              </div>
            </div>

            {/* 3. Bottom Row: Snapshot & Structured Competency Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Snapshot Metric */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400">Total Verified Competencies</span>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">
                    {scatterData.length} Skills
                  </div>
                  <p className="text-xs text-emerald-400 font-mono mt-1">
                    ↑ +{github?.total_commits ?? 0} commits analyzed
                  </p>
                </div>

                <div className="w-28 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getSparklineData(data?.match_readiness_percentage ?? 50)}>
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Structured Progress Bars */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 shadow-sm space-y-2.5">
                <span className="text-[10px] uppercase font-mono text-slate-400">Core Skill Competency Tracks</span>
                <div className="space-y-2">
                  {scatterData.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300 font-semibold">{item.name}</span>
                        <span className="text-slate-400">{item.current}% / {item.target}%</span>
                      </div>
                      <div className="h-2 w-full bg-[#0d1117] rounded-full overflow-hidden border border-[#30363d]">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          style={{ width: `${Math.min(100, item.current)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ────────────────── RIGHT COLUMN (4 / 12) ────────────────── */}
          <div className="col-span-12 xl:col-span-4 space-y-5">
            {/* Top Right: Bar Chart with 3 Stats */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                  Target Benchmark Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified score compared against required benchmark.
                </p>
              </div>

              {/* 3 top stat numbers */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#30363d]/60 text-center font-mono">
                <div>
                  <div className="text-base font-bold text-slate-100">
                    {data?.match_readiness_percentage ?? 0}%
                  </div>
                  <span className="text-[9px] uppercase text-slate-400">Readiness</span>
                </div>
                <div>
                  <div className="text-base font-bold text-indigo-400">
                    {github?.total_commits ?? 0}
                  </div>
                  <span className="text-[9px] uppercase text-slate-400">Commits</span>
                </div>
                <div>
                  <div className="text-base font-bold text-purple-400">
                    {github?.repo_count ?? 0}
                  </div>
                  <span className="text-[9px] uppercase text-slate-400">Repos</span>
                </div>
              </div>

              {/* Bar Chart Container */}
              <div className="h-64 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillChartData.slice(0, 5)} margin={{ top: 10, right: 15, left: 5, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                    <XAxis
                      dataKey="skill"
                      stroke="#8b949e"
                      fontSize={10}
                      tickLine={false}
                      interval={0}
                      dy={5}
                    />
                    <YAxis
                      stroke="#8b949e"
                      fontSize={10}
                      domain={[0, 100]}
                      width={32}
                      unit="%"
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#030712',
                        borderColor: '#30363d',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                      }}
                    />
                    <Bar dataKey="current" name="Verified" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" name="Target" fill="#30363d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Right: Clean Table / Scatter Matrix Toggle */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#30363d]/60 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 tracking-tight">
                    Competency Allocation
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Detailed breakdown by skill</p>
                </div>

                {/* View Mode Toggle: List vs Scatter */}
                <div className="flex items-center bg-[#0d1117] p-1 rounded-xl border border-[#30363d] text-[10px] font-mono">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'table' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('scatter')}
                    className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                      viewMode === 'scatter' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Scatter
                  </button>
                </div>
              </div>

              {viewMode === 'table' ? (
                /* Table View matching the reference card style */
                <div className="space-y-3">
                  <div className="divide-y divide-[#30363d]/40">
                    {paginatedSkills.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                              item.status === 'Mastered'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}
                          >
                            {item.name[0]}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-200 truncate">{item.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono">Target: {item.target}%</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 font-mono">
                          <span className="text-xs font-bold text-slate-100">{item.current}%</span>

                          {/* Mini Sparkline */}
                          <div className="w-12 h-6 hidden sm:block">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={getSparklineData(item.current)}>
                                <Line
                                  type="monotone"
                                  dataKey="v"
                                  stroke={item.status === 'Mastered' ? '#10b981' : '#f43f5e'}
                                  strokeWidth={1.5}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              item.status === 'Mastered'
                                ? 'bg-emerald-950 text-emerald-400'
                                : item.status === 'Critical Gap'
                                ? 'bg-rose-950 text-rose-400'
                                : 'bg-amber-950 text-amber-400'
                            }`}
                          >
                            {item.shortfall > 0 ? `-${item.shortfall}%` : 'Met'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Clean Pagination Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#30363d]/60 text-xs font-mono text-slate-400">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      ← Previous
                    </button>
                    <span className="text-[11px]">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              ) : (
                /* Scatter Matrix View */
                <div className="h-72 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 15, right: 20, bottom: 35, left: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                      <XAxis
                        type="number"
                        dataKey="current"
                        name="Verified"
                        unit="%"
                        domain={[0, 100]}
                        stroke="#8b949e"
                        fontSize={10}
                        tickLine={false}
                        label={{
                          value: 'Verified (%)',
                          position: 'insideBottom',
                          offset: -10,
                          fill: '#8b949e',
                          fontSize: 10,
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="target"
                        name="Goal"
                        unit="%"
                        domain={[0, 100]}
                        stroke="#8b949e"
                        fontSize={10}
                        width={35}
                        tickLine={false}
                        label={{
                          value: 'Goal (%)',
                          angle: -90,
                          position: 'insideLeft',
                          offset: 8,
                          fill: '#8b949e',
                          fontSize: 10,
                        }}
                      />
                      <ZAxis type="number" dataKey="shortfall" range={[80, 200]} />
                      <Tooltip content={<CustomScatterTooltip />} />
                      <ReferenceLine
                        segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
                        stroke="#484f58"
                        strokeDasharray="4 4"
                      />
                      <Scatter name="Mastered" data={masteredPoints} fill="#10b981" shape="circle" />
                      <Scatter name="Moderate" data={moderatePoints} fill="#06b6d4" shape="circle" />
                      <Scatter name="Critical" data={criticalPoints} fill="#f43f5e" shape="circle" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

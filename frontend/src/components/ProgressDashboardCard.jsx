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

const PIE_COLORS = ['#2383E2', '#6940A5', '#0F7B6C', '#D9730D', '#DF5452', '#0B6E99']
const AREA_COLORS = ['#2383E2', '#DF5452', '#0F7B6C', '#6940A5']

// Custom Tooltip for Line & Area Charts
function CustomTrajectoryTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E9E9E7] rounded-md p-2.5 shadow-none min-w-[160px] space-y-1.5 z-50 pointer-events-none">
        <p className="font-semibold text-[#37352F] text-xs border-b border-[#E9E9E7] pb-1">
          {label}
        </p>
        <div className="space-y-1">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#787774]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-semibold text-[#37352F]">{entry.value}%</span>
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
      <div className="bg-white border border-[#E9E9E7] rounded-md p-2.5 shadow-none min-w-[170px] space-y-1.5 z-50 pointer-events-none">
        <div className="flex items-center justify-between gap-2 border-b border-[#E9E9E7] pb-1">
          <span className="font-semibold text-[#37352F] text-xs">{data.name}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
              data.status === 'Mastered'
                ? 'bg-[#DBEDDB] text-[#1c3829] border border-[#c2e2c2]'
                : data.status === 'Critical Gap'
                ? 'bg-[#FFE2DD] text-[#5d1715] border border-[#f5c6cb]'
                : 'bg-[#FDECC8] text-[#402f1d] border border-[#fae0a6]'
            }`}
          >
            {data.status}
          </span>
        </div>
        <div className="space-y-1 font-mono text-xs">
          <div className="flex items-center justify-between gap-4 text-[#37352F]">
            <span className="text-[#787774]">Verified:</span>
            <span className="font-semibold text-[#0F7B6C]">{data.current}%</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[#37352F]">
            <span className="text-[#787774]">Goal:</span>
            <span className="text-[#787774]">{data.target}%</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-[#37352F]">
            <span className="text-[#787774]">Shortfall:</span>
            <span className={`font-semibold ${data.shortfall > 0 ? 'text-[#DF5452]' : 'text-[#0F7B6C]'}`}>
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
      {/* ═══════════ TOP BANNER (Notion Minimalist Header) ═══════════ */}
      <div className="rounded-md bg-[#F7F7F5] border border-[#E9E9E7] p-4 sm:p-5 text-[#37352F]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-white border border-[#E9E9E7] flex items-center justify-center text-lg">
              📊
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-[#37352F] flex items-center gap-2">
                Executive Progress & Performance
              </h1>
              <p className="text-xs text-[#787774]">
                Verified GitHub competencies, roadmap milestone pacing, and career goal benchmarks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-md bg-[#D3E5EF] text-[#183347] font-medium border border-[#b8d7eb] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2383E2]" />
              {data?.career_title || 'Software Engineer'}
            </span>

            <button
              onClick={fetchProgress}
              disabled={loading}
              className="text-xs px-3 py-1 rounded-md bg-white text-[#37352F] border border-[#E9E9E7] font-medium hover:bg-[rgba(55,53,47,0.06)] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>↻</span> Refresh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[#FFE2DD] border border-[#f5c6cb] rounded-md text-xs text-[#5d1715]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-xs font-mono text-[#787774] animate-pulse">
          Aggregating verified learner metrics & preparing dashboard…
        </div>
      ) : (
        /* ═══════════ MAIN 2-COLUMN DASHBOARD GRID ═══════════ */
        <div className="grid grid-cols-12 gap-5">
          {/* ────────────────── LEFT COLUMN (8 / 12) ────────────────── */}
          <div className="col-span-12 xl:col-span-8 space-y-5">
            {/* 1. Large Trajectory Chart */}
            <div className="bg-white border border-[#E9E9E7] rounded-md p-5 shadow-none space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E9E9E7] pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-[#37352F] tracking-tight">
                    Skill Performance & Growth Trajectory
                  </h2>
                  <p className="text-xs text-[#787774] mt-0.5">
                    Continuous velocity curve tracked across roadmap milestones.
                  </p>
                </div>

                {/* Timeframe pill tabs */}
                <div className="flex items-center bg-[#F7F7F5] p-1 rounded-md border border-[#E9E9E7] text-[11px] font-mono self-start sm:self-auto gap-1">
                  {[
                    { id: '12m', label: '12 months' },
                    { id: '30d', label: '30 days' },
                    { id: '7d', label: '7 days' },
                    { id: '24h', label: '24 hours' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setTimeframe(tab.id)}
                      className={`px-2.5 py-1 rounded-sm transition-all cursor-pointer ${
                        timeframe === tab.id
                          ? 'bg-white text-[#37352F] font-semibold border border-[#E9E9E7] shadow-none'
                          : 'text-[#787774] hover:text-[#37352F]'
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
                        <stop offset="5%" stopColor="#2383E2" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#2383E2" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="gradSecondary" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DF5452" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#DF5452" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E9E9E7" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#787774"
                      fontSize={11}
                      tickLine={false}
                      dy={5}
                    />
                    <YAxis
                      stroke="#787774"
                      fontSize={11}
                      domain={[0, 100]}
                      width={35}
                      tickLine={false}
                      unit="%"
                    />
                    <Tooltip content={<CustomTrajectoryTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    {trackedSkills.slice(0, 4).map((skillName, idx) => (
                      <Area
                        key={skillName}
                        type="monotone"
                        dataKey={skillName}
                        stroke={AREA_COLORS[idx % AREA_COLORS.length]}
                        strokeWidth={2}
                        fill={idx === 0 ? 'url(#gradPrimary)' : idx === 1 ? 'url(#gradSecondary)' : 'transparent'}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 2. Middle Row: 3 Modular Visual Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card B1: Language Distribution */}
              <div className="bg-white border border-[#E9E9E7] rounded-md p-4 shadow-none flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#37352F]">
                    Language Distribution
                  </h3>
                  <p className="text-[11px] text-[#787774] mt-0.5">Verified code share</p>
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
                        <span className="flex items-center gap-1.5 truncate text-[#37352F]">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                          />
                          {lang.name}
                        </span>
                        <span className="text-[#787774] font-medium">{lang.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E9E9E7] text-[10px] text-[#787774] font-mono flex items-center justify-between">
                  <span>{github?.repo_count ?? 0} repos scanned</span>
                  <span className="text-[#0F7B6C] font-semibold">✓ Active</span>
                </div>
              </div>

              {/* Card B2: Roadmap Sprint Circular Ring */}
              <div className="bg-white border border-[#E9E9E7] rounded-md p-4 shadow-none flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#37352F]">
                    Roadmap Milestone Sprint
                  </h3>
                  <p className="text-[11px] text-[#787774] mt-0.5">Execution pacing</p>
                </div>

                {/* Circular ring meter with centered text */}
                <div className="relative my-2 flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      stroke="#E9E9E7"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="38"
                      stroke="#2383E2"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={238.76}
                      strokeDashoffset={238.76 * (1 - (roadmap?.percentage ?? 0) / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xl font-bold text-[#37352F] font-mono">
                      {roadmap?.percentage ?? 0}%
                    </span>
                    <span className="text-[10px] text-[#787774] uppercase font-mono">Done</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E9E9E7] text-[10px] text-[#787774] font-mono flex items-center justify-between">
                  <span>{roadmap?.completed_tasks ?? 0}/{roadmap?.total_tasks ?? 0} tasks done</span>
                  <span className="text-[#2383E2] font-semibold">{roadmap?.total_hours ?? 0}h total</span>
                </div>
              </div>

              {/* Card B3: Target Readiness Semi-Circle Speedometer */}
              <div className="bg-white border border-[#E9E9E7] rounded-md p-4 shadow-none flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#37352F]">
                    Target Career Readiness
                  </h3>
                  <p className="text-[11px] text-[#787774] mt-0.5">Verified benchmark match</p>
                </div>

                {/* Semi-circle Gauge */}
                <div className="relative my-2 flex flex-col items-center justify-center">
                  <svg className="w-28 h-16 overflow-hidden">
                    <path
                      d="M 10 56 A 46 46 0 0 1 102 56"
                      fill="none"
                      stroke="#E9E9E7"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 10 56 A 46 46 0 0 1 102 56"
                      fill="none"
                      stroke="#6940A5"
                      strokeWidth="10"
                      strokeDasharray={144.5}
                      strokeDashoffset={144.5 * (1 - (data?.match_readiness_percentage ?? 0) / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center mt-1">
                    <span className="text-2xl font-bold text-[#37352F] font-mono">
                      {data?.match_readiness_percentage ?? 0}%
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E9E9E7] text-[10px] text-[#787774] font-mono flex items-center justify-between">
                  <span className="truncate">{data?.career_title || 'Role'}</span>
                  <span className="text-[#6940A5] font-semibold">Benchmark</span>
                </div>
              </div>
            </div>

            {/* 3. Bottom Row: Snapshot & Structured Competency Progress */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Snapshot Metric */}
              <div className="bg-white border border-[#E9E9E7] rounded-md p-4 shadow-none flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#787774]">Total Verified Competencies</span>
                  <div className="text-2xl font-bold text-[#37352F] font-mono mt-0.5">
                    {scatterData.length} Skills
                  </div>
                  <p className="text-xs text-[#0F7B6C] font-mono mt-1">
                    ↑ +{github?.total_commits ?? 0} commits analyzed
                  </p>
                </div>

                <div className="w-28 h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getSparklineData(data?.match_readiness_percentage ?? 50)}>
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke="#0F7B6C"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Structured Progress Bars */}
              <div className="bg-white border border-[#E9E9E7] rounded-md p-4 shadow-none space-y-2.5">
                <span className="text-[10px] uppercase font-mono text-[#787774]">Core Skill Competency Tracks</span>
                <div className="space-y-2">
                  {scatterData.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#37352F] font-medium">{item.name}</span>
                        <span className="text-[#787774]">{item.current}% / {item.target}%</span>
                      </div>
                      <div className="h-2 w-full bg-[#E9E9E7] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2383E2] rounded-full"
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
            <div className="bg-white border border-[#E9E9E7] rounded-md p-5 shadow-none space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#37352F] tracking-tight">
                  Target Benchmark Breakdown
                </h3>
                <p className="text-xs text-[#787774] mt-0.5">
                  Verified score compared against required benchmark.
                </p>
              </div>

              {/* 3 top stat numbers */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#E9E9E7] text-center font-mono">
                <div>
                  <div className="text-base font-bold text-[#37352F]">
                    {data?.match_readiness_percentage ?? 0}%
                  </div>
                  <span className="text-[9px] uppercase text-[#787774]">Readiness</span>
                </div>
                <div>
                  <div className="text-base font-bold text-[#2383E2]">
                    {github?.total_commits ?? 0}
                  </div>
                  <span className="text-[9px] uppercase text-[#787774]">Commits</span>
                </div>
                <div>
                  <div className="text-base font-bold text-[#6940A5]">
                    {github?.repo_count ?? 0}
                  </div>
                  <span className="text-[9px] uppercase text-[#787774]">Repos</span>
                </div>
              </div>

              {/* Bar Chart Container */}
              <div className="h-64 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skillChartData.slice(0, 5)} margin={{ top: 10, right: 15, left: 5, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E9E9E7" vertical={false} />
                    <XAxis
                      dataKey="skill"
                      stroke="#787774"
                      fontSize={10}
                      tickLine={false}
                      interval={0}
                      dy={5}
                    />
                    <YAxis
                      stroke="#787774"
                      fontSize={10}
                      domain={[0, 100]}
                      width={32}
                      unit="%"
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E9E9E7',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#37352F',
                        boxShadow: 'none',
                      }}
                    />
                    <Bar dataKey="current" name="Verified" fill="#2383E2" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" name="Target" fill="#E9E9E7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Right: Clean Table / Scatter Matrix Toggle */}
            <div className="bg-white border border-[#E9E9E7] rounded-md p-5 shadow-none space-y-4">
              <div className="flex items-center justify-between border-b border-[#E9E9E7] pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#37352F] tracking-tight">
                    Competency Allocation
                  </h3>
                  <p className="text-xs text-[#787774] mt-0.5">Detailed breakdown by skill</p>
                </div>

                {/* View Mode Toggle: List vs Scatter */}
                <div className="flex items-center bg-[#F7F7F5] p-1 rounded-md border border-[#E9E9E7] text-[10px] font-mono gap-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
                      viewMode === 'table' ? 'bg-white text-[#37352F] font-semibold border border-[#E9E9E7]' : 'text-[#787774] hover:text-[#37352F]'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setViewMode('scatter')}
                    className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
                      viewMode === 'scatter' ? 'bg-white text-[#37352F] font-semibold border border-[#E9E9E7]' : 'text-[#787774] hover:text-[#37352F]'
                    }`}
                  >
                    Scatter
                  </button>
                </div>
              </div>

              {viewMode === 'table' ? (
                /* Table View matching the reference card style */
                <div className="space-y-3">
                  <div className="divide-y divide-[#E9E9E7]">
                    {paginatedSkills.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 ${
                              item.status === 'Mastered'
                                ? 'bg-[#DBEDDB] text-[#1c3829] border border-[#c2e2c2]'
                                : 'bg-[#D3E5EF] text-[#183347] border border-[#b8d7eb]'
                            }`}
                          >
                            {item.name[0]}
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-medium text-[#37352F] truncate">{item.name}</p>
                            <span className="text-[10px] text-[#787774] font-mono">Target: {item.target}%</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 font-mono">
                          <span className="text-xs font-semibold text-[#37352F]">{item.current}%</span>

                          {/* Mini Sparkline */}
                          <div className="w-12 h-6 hidden sm:block">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={getSparklineData(item.current)}>
                                <Line
                                  type="monotone"
                                  dataKey="v"
                                  stroke={item.status === 'Mastered' ? '#0F7B6C' : '#DF5452'}
                                  strokeWidth={1.5}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                              item.status === 'Mastered'
                                ? 'bg-[#DBEDDB] text-[#1c3829] border border-[#c2e2c2]'
                                : item.status === 'Critical Gap'
                                ? 'bg-[#FFE2DD] text-[#5d1715] border border-[#f5c6cb]'
                                : 'bg-[#FDECC8] text-[#402f1d] border border-[#fae0a6]'
                            }`}
                          >
                            {item.shortfall > 0 ? `-${item.shortfall}%` : 'Met'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Clean Pagination Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E9E9E7] text-xs font-mono text-[#787774]">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="hover:text-[#37352F] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed font-medium"
                    >
                      ← Previous
                    </button>
                    <span className="text-[11px]">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="hover:text-[#37352F] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed font-medium"
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#E9E9E7" />
                      <XAxis
                        type="number"
                        dataKey="current"
                        name="Verified"
                        unit="%"
                        domain={[0, 100]}
                        stroke="#787774"
                        fontSize={10}
                        tickLine={false}
                        label={{
                          value: 'Verified (%)',
                          position: 'insideBottom',
                          offset: -10,
                          fill: '#787774',
                          fontSize: 10,
                        }}
                      />
                      <YAxis
                        type="number"
                        dataKey="target"
                        name="Goal"
                        unit="%"
                        domain={[0, 100]}
                        stroke="#787774"
                        fontSize={10}
                        width={35}
                        tickLine={false}
                        label={{
                          value: 'Goal (%)',
                          angle: -90,
                          position: 'insideLeft',
                          offset: 8,
                          fill: '#787774',
                          fontSize: 10,
                        }}
                      />
                      <ZAxis type="number" dataKey="shortfall" range={[80, 200]} />
                      <Tooltip content={<CustomScatterTooltip />} />
                      <ReferenceLine
                        segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
                        stroke="#787774"
                        strokeDasharray="4 4"
                      />
                      <Scatter name="Mastered" data={masteredPoints} fill="#0F7B6C" shape="circle" />
                      <Scatter name="Moderate" data={moderatePoints} fill="#2383E2" shape="circle" />
                      <Scatter name="Critical" data={criticalPoints} fill="#DF5452" shape="circle" />
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

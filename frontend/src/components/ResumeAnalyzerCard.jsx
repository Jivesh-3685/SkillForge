import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

const SAMPLE_RESUME = `Alex Rivera
Software Engineer | Full-Stack & AI
GitHub: github.com/alexrivera | Email: alex@example.com

SKILLS:
- Languages: Python, JavaScript, TypeScript, SQL
- Frameworks & Libs: React, FastAPI, Node.js, Docker
- Machine Learning & AI: Machine Learning, PyTorch, Deep Learning, LLMs & Generative AI
- Databases: PostgreSQL, MongoDB

EXPERIENCE:
Full-Stack Developer | CloudTech Solutions
- Designed and built scalable microservices using FastAPI and PostgreSQL.
- Developed interactive web dashboards with React and Tailwind CSS.
- Deployed containerized applications with Docker.
`

export default function ResumeAnalyzerCard() {
  const { idToken, currentUser } = useAuth()
  const [mode, setMode] = useState('text') // 'text' | 'file'
  const [resumeText, setResumeText] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('verified') // 'verified' | 'unverified' | 'hidden'

  const fetchLatest = useCallback(async () => {
    if (!idToken) return
    try {
      setLoading(true)
      const res = await fetch('/api/resume/latest', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.has_analysis) {
          setAnalysis(data)
        }
      }
    } catch (err) {
      console.error('Failed to fetch latest resume analysis:', err)
    } finally {
      setLoading(false)
    }
  }, [idToken])

  useEffect(() => {
    if (idToken) {
      fetchLatest()
    }
  }, [idToken, fetchLatest])

  const handleAnalyze = async () => {
    if (!idToken) {
      setError('Please sign in to analyze your resume.')
      return
    }

    if (mode === 'text' && (!resumeText || resumeText.trim().length < 20)) {
      setError('Please enter at least 20 characters of resume text.')
      return
    }

    if (mode === 'file' && !selectedFile) {
      setError('Please select a PDF or TXT file to upload.')
      return
    }

    setError('')
    setAnalyzing(true)

    try {
      const formData = new FormData()
      if (mode === 'file') {
        formData.append('file', selectedFile)
      } else {
        formData.append('resume_text', resumeText)
      }

      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Resume analysis failed')
      }

      setAnalysis(data)
    } catch (err) {
      setError(err.message || 'Network error analyzing resume.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleLoadSample = () => {
    setMode('text')
    setResumeText(SAMPLE_RESUME)
    setError('')
  }

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 text-slate-100 shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#30363d] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Resume vs GitHub Matcher
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              FR-10 • Interview Defense
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare claimed skills on your resume against real GitHub code activity to detect unverified claims and uncover omitted strengths.
          </p>
        </div>

        <button
          onClick={handleLoadSample}
          className="text-xs px-3 py-1.5 rounded-lg border border-[#30363d] hover:border-slate-500 bg-[#21262d] text-slate-300 hover:text-white transition-colors self-start md:self-auto flex items-center gap-1.5"
        >
          <span>💡</span> Try Sample Resume
        </button>
      </div>

      {/* Input Options */}
      <div className="mt-5 space-y-4">
        <div className="flex gap-2 p-1 bg-[#0d1117] rounded-xl border border-[#30363d] max-w-xs">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${
              mode === 'text'
                ? 'bg-[#238636] text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Paste Text
          </button>
          <button
            onClick={() => setMode('file')}
            className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${
              mode === 'file'
                ? 'bg-[#238636] text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Upload PDF / TXT
          </button>
        </div>

        {mode === 'text' ? (
          <div>
            <textarea
              rows={5}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume, skills section, or job application bio here..."
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#30363d] hover:border-slate-500 rounded-xl p-6 text-center bg-[#0d1117] transition-colors">
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
              id="resume-file-input"
            />
            <label
              htmlFor="resume-file-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <span className="text-3xl">📁</span>
              <span className="text-sm font-medium text-slate-200">
                {selectedFile ? selectedFile.name : 'Click to choose resume PDF or TXT'}
              </span>
              <span className="text-xs text-slate-500">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB selected`
                  : 'Supported formats: .pdf, .txt, .md (Max 5MB)'}
              </span>
            </label>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {analyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Analyzing against GitHub data...</span>
            </>
          ) : (
            <>
              <span>🔍</span>
              <span>Compare Resume Against Verified GitHub Code</span>
            </>
          )}
        </button>
      </div>

      {/* Analysis Results Display */}
      {analysis && (
        <div className="mt-8 pt-6 border-t border-[#30363d] space-y-6 animate-fadeIn">
          {/* Credibility Score Banner */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Resume Code Credibility
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-white">
                    {analysis.summary.credibility_pct}%
                  </span>
                  <span className="text-xs text-slate-400">
                    of claimed skills verified by public GitHub activity
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-[#161b22] border border-[#30363d] text-slate-300">
                  Claimed: <strong className="text-white">{analysis.summary.total_claimed}</strong>
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-emerald-950/60 border border-emerald-800/50 text-emerald-300">
                  Verified: <strong className="text-emerald-200">{analysis.summary.verified_count}</strong>
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-950/60 border border-amber-800/50 text-amber-300">
                  Unverified: <strong className="text-amber-200">{analysis.summary.unverified_count}</strong>
                </span>
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-950/60 border border-indigo-800/50 text-indigo-300">
                  Hidden Gems: <strong className="text-indigo-200">{analysis.summary.hidden_strengths_count}</strong>
                </span>
              </div>
            </div>

            {/* Credibility Progress Bar */}
            <div className="w-full bg-[#161b22] h-2.5 rounded-full overflow-hidden mt-4 border border-[#30363d]/60">
              <div
                className={`h-full transition-all duration-700 ${
                  analysis.summary.credibility_pct >= 70
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : analysis.summary.credibility_pct >= 40
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                    : 'bg-gradient-to-r from-rose-500 to-red-400'
                }`}
                style={{ width: `${analysis.summary.credibility_pct}%` }}
              />
            </div>
          </div>

          {/* Actionable Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Actionable Recruiter Insights
              </h4>
              <div className="space-y-2">
                {analysis.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-slate-300 flex items-start gap-2.5"
                  >
                    <span className="text-emerald-400 text-sm mt-0.5">💡</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown Tabs */}
          <div>
            <div className="flex border-b border-[#30363d] gap-4 mb-4">
              <button
                onClick={() => setActiveTab('verified')}
                className={`pb-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'verified'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>✅</span> Verified by GitHub ({analysis.verified_skills?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('unverified')}
                className={`pb-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'unverified'
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>⚠️</span> Interview Risks / Unverified ({analysis.unverified_skills?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('hidden')}
                className={`pb-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'hidden'
                    ? 'border-indigo-400 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>💎</span> Hidden Strengths Omitted ({analysis.hidden_strengths?.length || 0})
              </button>
            </div>

            {/* Tab: Verified */}
            {activeTab === 'verified' && (
              <div className="space-y-2.5">
                {(!analysis.verified_skills || analysis.verified_skills.length === 0) ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No claimed skills have verified GitHub code proof yet.
                  </p>
                ) : (
                  analysis.verified_skills.map((skill) => (
                    <div
                      key={skill.skill_id}
                      className="p-3 bg-[#0d1117] border border-emerald-900/40 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">
                            {skill.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                            {skill.status}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{skill.category}</span>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        {skill.repos_count > 0 && (
                          <div className="text-xs text-slate-400 hidden sm:block">
                            <span>{skill.repos_count} repos</span> •{' '}
                            <span>{skill.commits_count} commits</span>
                          </div>
                        )}
                        <div className="w-16 bg-[#161b22] h-2 rounded-full overflow-hidden border border-[#30363d]">
                          <div
                            className="bg-emerald-400 h-full"
                            style={{ width: `${skill.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-300 w-8">
                          {skill.score}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Unverified / Interview Risks */}
            {activeTab === 'unverified' && (
              <div className="space-y-2.5">
                {(!analysis.unverified_skills || analysis.unverified_skills.length === 0) ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Great news! None of your claimed skills are unverified.
                  </p>
                ) : (
                  analysis.unverified_skills.map((skill) => (
                    <div
                      key={skill.skill_id}
                      className="p-3 bg-[#0d1117] border border-amber-900/40 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">
                            {skill.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-950 text-amber-400 border border-amber-800/60">
                            {skill.status}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-amber-300">
                          GitHub Score: {skill.score}%
                        </span>
                      </div>

                      <p className="text-xs text-amber-200/80">
                        ⚠️ <strong>Risk:</strong> {skill.risk}
                      </p>
                      <p className="text-xs text-slate-400">
                        💡 <strong>Suggestion:</strong> {skill.suggestion}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Hidden Strengths Omitted */}
            {activeTab === 'hidden' && (
              <div className="space-y-2.5">
                {(!analysis.hidden_strengths || analysis.hidden_strengths.length === 0) ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No omitted strengths detected. All your top GitHub skills are on your resume!
                  </p>
                ) : (
                  analysis.hidden_strengths.map((skill) => (
                    <div
                      key={skill.skill_id}
                      className="p-3 bg-[#0d1117] border border-indigo-900/40 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">
                            {skill.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-indigo-950 text-indigo-400 border border-indigo-800/60">
                            Verified on GitHub
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{skill.suggestion}</p>
                      </div>

                      <div className="text-right flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-mono font-bold text-indigo-300">
                          {skill.score}% score
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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
  const { idToken } = useAuth()
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
    <div className="bg-white border border-[#E9E9E7] rounded-md p-6 text-[#37352F] shadow-none space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#E9E9E7] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <h3 className="text-base font-semibold text-[#37352F] tracking-tight">
              Resume vs GitHub Matcher
            </h3>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-[#D3E5EF] text-[#183347] border border-[#b8d7eb]">
              Interview Defense
            </span>
          </div>
          <p className="text-xs text-[#787774] mt-1">
            Compare claimed skills on your resume against real GitHub code activity to detect unverified claims and uncover omitted strengths.
          </p>
        </div>

        <button
          onClick={handleLoadSample}
          className="text-xs px-3 py-1.5 rounded-md border border-[#E9E9E7] hover:bg-[#F7F7F5] bg-white text-[#37352F] transition-colors self-start md:self-auto flex items-center gap-1.5 cursor-pointer font-medium"
        >
          <span>💡</span> Try Sample Resume
        </button>
      </div>

      {/* Input Options */}
      <div className="space-y-4">
        <div className="flex gap-1.5 p-1 bg-[#F7F7F5] rounded-md border border-[#E9E9E7] max-w-xs">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 text-xs py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
              mode === 'text'
                ? 'bg-white text-[#37352F] border border-[#E9E9E7] shadow-none'
                : 'text-[#787774] hover:text-[#37352F]'
            }`}
          >
            Paste Text
          </button>
          <button
            onClick={() => setMode('file')}
            className={`flex-1 text-xs py-1.5 rounded-sm font-medium transition-all cursor-pointer ${
              mode === 'file'
                ? 'bg-white text-[#37352F] border border-[#E9E9E7] shadow-none'
                : 'text-[#787774] hover:text-[#37352F]'
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
              className="w-full bg-[#F7F7F5] border border-[#E9E9E7] focus:bg-white focus:border-[#2383E2] rounded-md p-3 text-xs text-[#37352F] placeholder-[#787774] focus:outline-none font-mono transition-colors"
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#E9E9E7] hover:border-[#787774] rounded-md p-6 text-center bg-[#F7F7F5] transition-colors">
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
              <span className="text-xs font-medium text-[#37352F]">
                {selectedFile ? selectedFile.name : 'Click to choose resume PDF or TXT'}
              </span>
              <span className="text-[11px] text-[#787774]">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB selected`
                  : 'Supported formats: .pdf, .txt, .md (Max 5MB)'}
              </span>
            </label>
          </div>
        )}

        {error && (
          <div className="p-3 bg-[#FFE2DD] border border-[#f5c6cb] rounded-md text-xs text-[#5d1715]">
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full py-2.5 px-4 rounded-md bg-[#2383E2] hover:bg-[#1d6fc2] text-white font-medium text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {analyzing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
        <div className="pt-6 border-t border-[#E9E9E7] space-y-6">
          {/* Credibility Score Banner */}
          <div className="bg-[#F7F7F5] border border-[#E9E9E7] rounded-md p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#787774]">
                  Resume Code Credibility
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold text-[#37352F] font-mono">
                    {analysis.summary.credibility_pct}%
                  </span>
                  <span className="text-xs text-[#787774]">
                    of claimed skills verified by public GitHub activity
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-[#E9E9E7] text-[#37352F]">
                  Claimed: <strong>{analysis.summary.total_claimed}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#DBEDDB] border border-[#c2e2c2] text-[#1c3829]">
                  Verified: <strong>{analysis.summary.verified_count}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#FDECC8] border border-[#fae0a6] text-[#402f1d]">
                  Unverified: <strong>{analysis.summary.unverified_count}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#D3E5EF] border border-[#b8d7eb] text-[#183347]">
                  Hidden Gems: <strong>{analysis.summary.hidden_strengths_count}</strong>
                </span>
              </div>
            </div>

            {/* Credibility Progress Bar */}
            <div className="w-full bg-[#E9E9E7] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ${
                  analysis.summary.credibility_pct >= 70
                    ? 'bg-[#0F7B6C]'
                    : analysis.summary.credibility_pct >= 40
                    ? 'bg-[#D9730D]'
                    : 'bg-[#DF5452]'
                }`}
                style={{ width: `${analysis.summary.credibility_pct}%` }}
              />
            </div>
          </div>

          {/* Actionable Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#787774]">
                Actionable Recruiter Insights
              </h4>
              <div className="space-y-2">
                {analysis.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#F7F7F5] border border-[#E9E9E7] rounded-md text-xs text-[#37352F] flex items-start gap-2.5"
                  >
                    <span className="text-sm mt-0.5">💡</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown Tabs */}
          <div>
            <div className="flex border-b border-[#E9E9E7] gap-4 mb-4">
              <button
                onClick={() => setActiveTab('verified')}
                className={`pb-2 text-xs font-medium tracking-wide border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'verified'
                    ? 'border-[#37352F] text-[#37352F]'
                    : 'border-transparent text-[#787774] hover:text-[#37352F]'
                }`}
              >
                <span>✅</span> Verified by GitHub ({analysis.verified_skills?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('unverified')}
                className={`pb-2 text-xs font-medium tracking-wide border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'unverified'
                    ? 'border-[#37352F] text-[#37352F]'
                    : 'border-transparent text-[#787774] hover:text-[#37352F]'
                }`}
              >
                <span>⚠️</span> Interview Risks ({analysis.unverified_skills?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab('hidden')}
                className={`pb-2 text-xs font-medium tracking-wide border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'hidden'
                    ? 'border-[#37352F] text-[#37352F]'
                    : 'border-transparent text-[#787774] hover:text-[#37352F]'
                }`}
              >
                <span>💎</span> Hidden Strengths ({analysis.hidden_strengths?.length || 0})
              </button>
            </div>

            {/* Tab: Verified */}
            {activeTab === 'verified' && (
              <div className="space-y-2">
                {(!analysis.verified_skills || analysis.verified_skills.length === 0) ? (
                  <p className="text-xs text-[#787774] py-4 text-center">
                    No claimed skills have verified GitHub code proof yet.
                  </p>
                ) : (
                  analysis.verified_skills.map((skill) => (
                    <div
                      key={skill.skill_id}
                      className="p-3 bg-[#F7F7F5] border border-[#E9E9E7] rounded-md flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-[#37352F]">
                            {skill.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#DBEDDB] text-[#1c3829] border border-[#c2e2c2]">
                            {skill.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#787774]">{skill.category}</span>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        {skill.repos_count > 0 && (
                          <div className="text-[11px] text-[#787774] hidden sm:block">
                            <span>{skill.repos_count} repos</span> •{' '}
                            <span>{skill.commits_count} commits</span>
                          </div>
                        )}
                        <div className="w-16 bg-[#E9E9E7] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#0F7B6C] h-full"
                            style={{ width: `${skill.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-semibold text-[#0F7B6C] w-8">
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
              <div className="space-y-2">
                {(!analysis.unverified_skills || analysis.unverified_skills.length === 0) ? (
                  <p className="text-xs text-[#787774] py-4 text-center">
                    Great news! None of your claimed skills are unverified.
                  </p>
                ) : (
                  analysis.unverified_skills.map((skill) => (
                    <div
                      key={skill.skill_id}
                      className="p-3 bg-[#F7F7F5] border border-[#E9E9E7] rounded-md space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-[#37352F]">
                            {skill.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#FDECC8] text-[#402f1d] border border-[#fae0a6]">
                            {skill.status}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-[#D9730D] font-medium">
                          GitHub Score: {skill.score}%
                        </span>
                      </div>

                      <p className="text-xs text-[#787774]">
                        ⚠️ <strong className="text-[#37352F]">Risk:</strong> {skill.risk}
                      </p>
                      <p className="text-xs text-[#787774]">
                        💡 <strong className="text-[#37352F]">Suggestion:</strong> {skill.suggestion}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Hidden Strengths Omitted */}
            {activeTab === 'hidden' && (
              <div className="space-y-2">
                {(!analysis.hidden_strengths || analysis.hidden_strengths.length === 0) ? (
                  <p className="text-xs text-[#787774] py-4 text-center">
                    No omitted strengths detected. All your top GitHub skills are on your resume!
                  </p>
                ) : (
                  analysis.hidden_strengths.map((skill) => (
                    <div
                      key={skill.skill_id}
                      className="p-3 bg-[#F7F7F5] border border-[#E9E9E7] rounded-md flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-[#37352F]">
                            {skill.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-[#D3E5EF] text-[#183347] border border-[#b8d7eb]">
                            Verified on GitHub
                          </span>
                        </div>
                        <p className="text-xs text-[#787774] mt-0.5">{skill.suggestion}</p>
                      </div>

                      <div className="text-right flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono font-medium text-[#2383E2]">
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

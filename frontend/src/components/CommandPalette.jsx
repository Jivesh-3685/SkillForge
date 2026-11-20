import { useState, useEffect } from 'react'

const COMMANDS = [
  { id: 'home', icon: '🏠', label: 'Home Dashboard', category: 'Navigation', desc: 'Overview and status' },
  { id: 'progress', icon: '📊', label: 'Progress Dashboard', category: 'Analytics', desc: 'Skill charts, completion ring & metrics' },
  { id: 'github', icon: '🐙', label: 'GitHub Integration', category: 'Data Sources', desc: 'Connect or re-scan GitHub activity' },
  { id: 'skills', icon: '⚡', label: 'Skill Scores', category: 'Skills', desc: 'Deterministic skill analysis & quiz' },
  { id: 'gaps', icon: '🎯', label: 'Skill Gap Analysis', category: 'Careers', desc: 'Target career comparison & shortfalls' },
  { id: 'resume', icon: '📄', label: 'Resume Matcher', category: 'Careers', desc: 'Audit resume claims against GitHub code' },
  { id: 'roadmap', icon: '🗺️', label: 'AI Learning Roadmap', category: 'Learning', desc: 'Week-by-week learning schedule' },
  { id: 'resources', icon: '📚', label: 'Free Resources', category: 'Learning', desc: 'Curated docs, videos and free courses' },
  { id: 'projects', icon: '💻', label: 'Portfolio Projects', category: 'Learning', desc: 'Hands-on projects matched to your gaps' },
  { id: 'mentor', icon: '🤖', label: 'AI Mentor Chat', category: 'AI Coaching', desc: 'Context-grounded career advisor' },
  { id: 'growth', icon: '📈', label: 'Growth Tracker', category: 'Analytics', desc: 'Scan history & score delta badges' },
  { id: 'settings', icon: '⚙️', label: 'Settings & Appearance', category: 'Preferences', desc: 'Themes, languages & customization' },
]

export default function CommandPalette({ isOpen, onClose, onSelect }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else onSelect('__TOGGLE_PALETTE__')
      }
      if (!isOpen) return

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, onSelect])

  const filtered = COMMANDS.filter((cmd) => {
    const q = query.toLowerCase()
    return (
      cmd.label.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      cmd.desc.toLowerCase().includes(q)
    )
  })

  const handleSelect = (id) => {
    onSelect(id)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/20 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-xl bg-white border border-[#E9E9E7] rounded-lg shadow-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E9E9E7]">
          <span className="text-[#787774] text-base">🔍</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Type a command, tool or search..."
            className="flex-1 bg-transparent text-sm text-[#37352F] placeholder-[#787774] focus:outline-none"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-[#E9E9E7] text-[#787774] bg-[#F7F7F5] font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5 no-scrollbar">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#787774]">
              No matching pages or tools found for "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[rgba(55,53,47,0.08)] text-[#37352F]'
                      : 'text-[#37352F] hover:bg-[rgba(55,53,47,0.04)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{item.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-[#37352F]">{item.label}</p>
                      <p className="text-[11px] text-[#787774]">{item.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F7F7F5] text-[#787774] border border-[#E9E9E7]">
                    {item.category}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-[#E9E9E7] bg-[#F7F7F5] flex items-center justify-between text-[11px] text-[#787774]">
          <span>Navigate with arrows, Enter to choose</span>
          <span className="font-mono">SkillForge v1.0</span>
        </div>
      </div>
    </div>
  )
}

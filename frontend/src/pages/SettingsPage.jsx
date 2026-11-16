import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function SettingsPage() {
  const { currentUser, userProfile, logout } = useAuth()
  const {
    settings,
    updateSetting,
    resetSettings,
    theme,
    accent,
    THEMES,
    LANGUAGES,
    ACCENT_COLORS,
  } = useTheme()

  const [activeSection, setActiveSection] = useState('appearance')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const sections = [
    { id: 'appearance', icon: '🎨', label: 'Appearance' },
    { id: 'language', icon: '🌐', label: 'Language & Region' },
    { id: 'preferences', icon: '🔧', label: 'Preferences' },
    { id: 'account', icon: '👤', label: 'Account' },
    { id: 'about', icon: 'ℹ️', label: 'About' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-extrabold tracking-tight ${theme.text}`}>Settings</h1>
        <p className={`text-sm mt-1 ${theme.textMuted}`}>
          Customize your SkillForge AI experience
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className={`lg:w-56 flex-shrink-0 ${theme.card} border ${theme.border} rounded-2xl p-2 lg:sticky lg:top-6 self-start`}>
          <nav className="space-y-0.5">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm transition-all ${
                  activeSection === s.id
                    ? 'bg-emerald-500/12 text-emerald-400 font-semibold'
                    : `${theme.textMuted} hover:bg-white/5 hover:text-white`
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">

          {/* ─── Appearance ─── */}
          {activeSection === 'appearance' && (
            <>
              {/* Theme Selector */}
              <div className={`${theme.card} border ${theme.border} rounded-2xl p-6`}>
                <h3 className={`text-base font-bold mb-1 ${theme.text}`}>Theme</h3>
                <p className={`text-xs mb-5 ${theme.textMuted}`}>Choose a color scheme for the interface</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.values(THEMES).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updateSetting('theme', t.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all text-left group ${
                        settings.theme === t.id
                          ? 'border-emerald-500 shadow-lg shadow-emerald-500/10'
                          : `${theme.border} hover:border-white/20`
                      }`}
                    >
                      {/* Theme Preview Swatches */}
                      <div className="flex gap-1.5 mb-3">
                        <div className={`w-6 h-6 rounded-md ${t.bg} border border-white/10`} />
                        <div className={`w-6 h-6 rounded-md ${t.sidebar} border border-white/10`} />
                        <div className={`w-6 h-6 rounded-md ${t.card} border border-white/10`} />
                      </div>
                      <p className={`text-sm font-semibold ${theme.text}`}>{t.name}</p>
                      <p className={`text-[10px] mt-0.5 ${theme.textMuted}`}>{t.description}</p>
                      {settings.theme === t.id && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <span className="text-[10px] text-white">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div className={`${theme.card} border ${theme.border} rounded-2xl p-6`}>
                <h3 className={`text-base font-bold mb-1 ${theme.text}`}>Accent Color</h3>
                <p className={`text-xs mb-5 ${theme.textMuted}`}>Highlight color used throughout the app</p>

                <div className="flex flex-wrap gap-3">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => updateSetting('accentColor', c.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all ${
                        settings.accentColor === c.id
                          ? 'border-white/40 shadow-lg'
                          : `${theme.border} hover:border-white/20`
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full ${c.class}`} />
                      <span className={`text-xs font-medium ${theme.text}`}>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className={`${theme.card} border ${theme.border} rounded-2xl p-6`}>
                <h3 className={`text-base font-bold mb-1 ${theme.text}`}>Font Size</h3>
                <p className={`text-xs mb-5 ${theme.textMuted}`}>Adjust the interface text size</p>

                <div className="flex gap-3">
                  {[
                    { id: 'small', label: 'Small', sample: 'Aa', size: 'text-xs' },
                    { id: 'normal', label: 'Normal', sample: 'Aa', size: 'text-sm' },
                    { id: 'large', label: 'Large', sample: 'Aa', size: 'text-base' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => updateSetting('fontSize', f.id)}
                      className={`flex-1 py-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                        settings.fontSize === f.id
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : `${theme.border} hover:border-white/20`
                      }`}
                    >
                      <span className={`font-bold ${f.size} ${theme.text}`}>{f.sample}</span>
                      <span className={`text-[10px] ${theme.textMuted}`}>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ─── Language & Region ─── */}
          {activeSection === 'language' && (
            <div className={`${theme.card} border ${theme.border} rounded-2xl p-6`}>
              <h3 className={`text-base font-bold mb-1 ${theme.text}`}>Display Language</h3>
              <p className={`text-xs mb-5 ${theme.textMuted}`}>
                Choose the language for the interface. Content and AI responses will adapt accordingly.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => updateSetting('language', lang.code)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                      settings.language === lang.code
                        ? 'border-emerald-500 bg-emerald-500/5'
                        : `${theme.border} hover:border-white/20`
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span className={`text-sm font-medium ${theme.text}`}>{lang.name}</span>
                    {settings.language === lang.code && (
                      <span className="ml-auto text-emerald-400 text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Preferences ─── */}
          {activeSection === 'preferences' && (
            <div className={`${theme.card} border ${theme.border} rounded-2xl p-6 space-y-5`}>
              <div>
                <h3 className={`text-base font-bold mb-1 ${theme.text}`}>Interface Preferences</h3>
                <p className={`text-xs ${theme.textMuted}`}>Tune how SkillForge behaves</p>
              </div>

              {[
                {
                  key: 'compactMode',
                  label: 'Compact Mode',
                  desc: 'Reduce padding and spacing for denser information display',
                },
                {
                  key: 'showPhaseLabels',
                  label: 'Show Phase Labels',
                  desc: 'Display development phase tags (FR-01, FR-02, etc.) on each card',
                },
                {
                  key: 'animationsEnabled',
                  label: 'Animations & Transitions',
                  desc: 'Enable smooth transitions and loading animations',
                },
                {
                  key: 'notificationsEnabled',
                  label: 'In-App Notifications',
                  desc: 'Show alerts when skill scores change or roadmap milestones are reached',
                },
              ].map((pref) => (
                <div key={pref.key} className={`flex items-center justify-between py-3 border-b ${theme.border} last:border-0`}>
                  <div>
                    <p className={`text-sm font-semibold ${theme.text}`}>{pref.label}</p>
                    <p className={`text-xs mt-0.5 ${theme.textMuted}`}>{pref.desc}</p>
                  </div>
                  <button
                    onClick={() => updateSetting(pref.key, !settings[pref.key])}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      settings[pref.key] ? 'bg-emerald-500' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        settings[pref.key] ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ─── Account ─── */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              {/* Profile Info */}
              <div className={`${theme.card} border ${theme.border} rounded-2xl p-6`}>
                <h3 className={`text-base font-bold mb-4 ${theme.text}`}>Profile Information</h3>

                {currentUser ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="" className="w-16 h-16 rounded-xl border-2 border-emerald-500/30 object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-2xl uppercase">
                          {(currentUser.displayName || currentUser.email || 'U')[0]}
                        </div>
                      )}
                      <div>
                        <p className={`text-lg font-bold ${theme.text}`}>
                          {userProfile?.display_name || currentUser.displayName || 'Learner'}
                        </p>
                        <p className={`text-sm ${theme.textMuted}`}>{currentUser.email}</p>
                        <p className={`text-xs font-mono mt-1 ${theme.textMuted}`}>
                          UID: {currentUser.uid?.slice(0, 16)}…
                        </p>
                      </div>
                    </div>

                    <div className={`grid grid-cols-2 gap-3 pt-3 border-t ${theme.border}`}>
                      <div className={`p-3 rounded-xl ${theme.bg} border ${theme.border}`}>
                        <p className={`text-[10px] uppercase tracking-wider ${theme.textMuted}`}>Auth Provider</p>
                        <p className={`text-sm font-semibold mt-0.5 ${theme.text}`}>
                          {currentUser.providerData?.[0]?.providerId === 'google.com' ? 'Google' : 'Email'}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${theme.bg} border ${theme.border}`}>
                        <p className={`text-[10px] uppercase tracking-wider ${theme.textMuted}`}>MongoDB Synced</p>
                        <p className={`text-sm font-semibold mt-0.5 ${theme.text}`}>
                          {userProfile?._id ? '✓ Yes' : '✗ No'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm ${theme.textMuted}`}>
                    Sign in to view and manage your account settings.
                  </p>
                )}
              </div>

              {/* Danger Zone */}
              {currentUser && (
                <div className="border-2 border-red-900/50 rounded-2xl p-6 bg-red-950/20">
                  <h3 className="text-base font-bold text-red-400 mb-1">Danger Zone</h3>
                  <p className="text-xs text-red-300/60 mb-4">
                    Irreversible actions. Proceed with caution.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={logout}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-800/50 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      🚪 Sign Out
                    </button>
                    <button className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-800/50 text-red-400 hover:bg-red-500/20 transition-colors opacity-60 cursor-not-allowed" disabled>
                      🗑️ Delete Account & Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── About ─── */}
          {activeSection === 'about' && (
            <div className={`${theme.card} border ${theme.border} rounded-2xl p-6 space-y-5`}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-extrabold ${theme.text}`}>
                    SkillForge <span className="text-emerald-400 font-mono text-sm">AI</span>
                  </h3>
                  <p className={`text-xs ${theme.textMuted}`}>v1.0.0 — Production MVP</p>
                </div>
              </div>

              <p className={`text-sm leading-relaxed ${theme.textMuted}`}>
                A GitHub-verified AI learning mentor that turns real coding activity into an evidence-based, personalized skill roadmap with curated resources, matched projects, and grounded AI mentoring.
              </p>

              <div className={`space-y-2 pt-3 border-t ${theme.border}`}>
                {[
                  { label: 'Tech Stack', value: 'React 19 + Vite + Tailwind • FastAPI + MongoDB Atlas • Firebase Auth • Gemini API' },
                  { label: 'Features', value: '12 Phases — FR-01 through FR-11 + FR-10 Resume Matcher' },
                  { label: 'Architecture', value: 'Deterministic scoring engine • Dual AI generator • Grounded mentor' },
                ].map((item) => (
                  <div key={item.label}>
                    <p className={`text-[10px] uppercase tracking-wider ${theme.textMuted}`}>{item.label}</p>
                    <p className={`text-xs mt-0.5 ${theme.text}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Reset All Settings */}
              <div className={`pt-4 border-t ${theme.border}`}>
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className={`text-xs px-4 py-2 rounded-xl border ${theme.border} ${theme.textMuted} hover:text-white hover:border-white/20 transition-colors`}
                  >
                    Reset All Settings to Default
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${theme.textMuted}`}>Are you sure?</span>
                    <button
                      onClick={() => { resetSettings(); setShowResetConfirm(false) }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      Yes, Reset
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className={`text-xs px-3 py-1.5 rounded-lg ${theme.textMuted} hover:text-white transition-colors`}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

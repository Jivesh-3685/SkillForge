import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function SettingsPage() {
  const { currentUser, userProfile, logout } = useAuth()
  const {
    settings,
    updateSetting,
    resetSettings,
    t,
    THEMES,
    ACCENT_MAP,
    LANGUAGES,
    FONT_SIZES,
  } = useTheme()

  const [activeSection, setActiveSection] = useState('appearance')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const sections = [
    { id: 'appearance', icon: '🎨', label: t('tabAppearance', 'Appearance') },
    { id: 'language', icon: '🌐', label: t('tabLanguage', 'Language & Region') },
    { id: 'preferences', icon: '🔧', label: t('tabPreferences', 'Preferences') },
    { id: 'account', icon: '👤', label: t('tabAccount', 'Account') },
    { id: 'about', icon: 'ℹ️', label: t('tabAbout', 'About') },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t('settingsTitle', 'Settings')}
        </h1>
        <p className="text-sm mt-1 opacity-70">
          {t('settingsSubtitle', 'Customize your SkillForge AI experience')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation Sidebar */}
        <div className="lg:w-60 flex-shrink-0 bg-[#161b22] border border-[#30363d] rounded-2xl p-2 lg:sticky lg:top-16 self-start shadow-sm">
          <nav className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-medium transition-all cursor-pointer ${
                  activeSection === s.id
                    ? 'bg-emerald-500/15 text-emerald-400 font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-base">{s.icon}</span>
                <span>{s.label}</span>
                {activeSection === s.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* ─── 1. Appearance Section ─── */}
          {activeSection === 'appearance' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Theme Selector */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold">
                    {t('themeLabel', 'Theme')}
                  </h3>
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-white/5 opacity-70">
                    Active: {THEMES[settings.theme]?.name || 'Dark'}
                  </span>
                </div>
                <p className="text-xs mb-5 opacity-70">
                  {t('themeDesc', 'Choose a color scheme for the interface')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.values(THEMES).map((tItem) => {
                    const isSelected = settings.theme === tItem.id
                    return (
                      <button
                        key={tItem.id}
                        onClick={() =>
                          updateSetting('theme', tItem.id, `✓ Theme set to ${tItem.name}`)
                        }
                        className={`relative p-4 rounded-xl border-2 transition-all text-left group cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-white/[0.03] shadow-md'
                            : 'border-[#30363d] hover:border-white/30 hover:bg-white/[0.01]'
                        }`}
                      >
                        {/* Theme Preview Color Swatches */}
                        <div className="flex gap-1.5 mb-3">
                          <div
                            className="w-6 h-6 rounded-md border border-white/20 shadow-xs"
                            style={{ backgroundColor: tItem.colors.bgMain }}
                            title="Main Background"
                          />
                          <div
                            className="w-6 h-6 rounded-md border border-white/20 shadow-xs"
                            style={{ backgroundColor: tItem.colors.bgCard }}
                            title="Card Surface"
                          />
                          <div
                            className="w-6 h-6 rounded-md border border-white/20 shadow-xs"
                            style={{ backgroundColor: tItem.colors.bgSidebar }}
                            title="Sidebar Surface"
                          />
                        </div>

                        <p className="text-sm font-semibold text-slate-100">
                          {tItem.name}
                        </p>
                        <p className="text-[11px] mt-0.5 text-slate-400">
                          {tItem.description}
                        </p>

                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                            ✓
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Accent Color */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold">
                    {t('accentLabel', 'Accent Color')}
                  </h3>
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-white/5 opacity-70">
                    Active: {ACCENT_MAP[settings.accentColor]?.name || 'Emerald'}
                  </span>
                </div>
                <p className="text-xs mb-5 opacity-70">
                  {t('accentDesc', 'Highlight color used for buttons, badges and progress indicators')}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {Object.values(ACCENT_MAP).map((acc) => {
                    const isSelected = settings.accentColor === acc.id
                    return (
                      <button
                        key={acc.id}
                        onClick={() =>
                          updateSetting('accentColor', acc.id, `✓ Accent set to ${acc.name}`)
                        }
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-white/50 bg-white/[0.04] shadow-sm'
                            : 'border-[#30363d] hover:border-white/20 hover:bg-white/[0.01]'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 shadow-xs"
                          style={{ backgroundColor: acc.primary }}
                        />
                        <span className="text-xs font-medium text-slate-200">
                          {acc.name}
                        </span>
                        {isSelected && (
                          <span className="ml-auto text-xs font-bold text-slate-200">
                            ✓
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Font Size */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base font-bold">
                    {t('fontSizeLabel', 'Font Size')}
                  </h3>
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-white/5 opacity-70">
                    Scale: {settings.fontSize || 'normal'}
                  </span>
                </div>
                <p className="text-xs mb-5 opacity-70">
                  {t('fontSizeDesc', 'Adjust the interface typography scale')}
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {FONT_SIZES.map((f) => {
                    const isSelected = settings.fontSize === f.id
                    return (
                      <button
                        key={f.id}
                        onClick={() =>
                          updateSetting('fontSize', f.id, `✓ Font size changed to ${f.label}`)
                        }
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-white/[0.03] shadow-sm'
                            : 'border-[#30363d] hover:border-white/20'
                        }`}
                      >
                        <span
                          className="font-bold text-slate-100"
                          style={{ fontSize: f.basePx }}
                        >
                          {f.sample}
                        </span>
                        <span className="text-xs text-slate-400 mt-1">
                          {f.label} ({f.basePx})
                        </span>
                        {isSelected && (
                          <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                            Active
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── 2. Language & Region Section ─── */}
          {activeSection === 'language' && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-sm animate-fadeIn space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-bold">
                  {t('languageLabel', 'Display Language')}
                </h3>
                <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-white/5 opacity-70">
                  Current: {LANGUAGES.find((l) => l.code === settings.language)?.name || 'English'}
                </span>
              </div>
              <p className="text-xs mb-5 opacity-70">
                {t('languageDesc', 'Choose the language for navigation, labels and AI mentoring prompts')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {LANGUAGES.map((lang) => {
                  const isSelected = settings.language === lang.code
                  return (
                    <button
                      key={lang.code}
                      onClick={() =>
                        updateSetting('language', lang.code, `✓ Language set to ${lang.name} (${lang.native})`)
                      }
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-white/[0.03] shadow-md'
                          : 'border-[#30363d] hover:border-white/30 hover:bg-white/[0.01]'
                      }`}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-100">
                          {lang.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {lang.native}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── 3. Preferences Section ─── */}
          {activeSection === 'preferences' && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-sm animate-fadeIn space-y-5">
              <div>
                <h3 className="text-base font-bold">
                  {t('prefTitle', 'Interface Preferences')}
                </h3>
                <p className="text-xs mt-0.5 opacity-70">
                  {t('prefDesc', 'Fine-tune interface density and visual behavior')}
                </p>
              </div>

              <div className="divide-y divide-[#30363d]">
                {/* Compact Mode */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {t('compactMode', 'Compact Mode')}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('compactModeDesc', 'Reduce padding and spacing for high-density information display')}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSetting(
                        'compactMode',
                        !settings.compactMode,
                        settings.compactMode ? 'Compact mode disabled' : 'Compact mode enabled'
                      )
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                      settings.compactMode ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        settings.compactMode ? 'translate-x-[26px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Show Phase Labels */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {t('showPhaseLabels', 'Show Development Phase Tags')}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('showPhaseLabelsDesc', 'Display spec identifiers (FR-01, FR-02, etc.) on each feature card')}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSetting(
                        'showPhaseLabels',
                        !settings.showPhaseLabels,
                        settings.showPhaseLabels ? 'Phase badges hidden' : 'Phase badges shown'
                      )
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                      settings.showPhaseLabels ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        settings.showPhaseLabels ? 'translate-x-[26px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Smooth Animations */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {t('animations', 'Smooth Animations')}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('animationsDesc', 'Enable smooth page transitions and interactive micro-animations')}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSetting(
                        'animationsEnabled',
                        !settings.animationsEnabled,
                        settings.animationsEnabled ? 'Animations turned off' : 'Animations turned on'
                      )
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                      settings.animationsEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        settings.animationsEnabled ? 'translate-x-[26px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* In-App Notifications */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {t('notifications', 'In-App Alerts')}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t('notificationsDesc', 'Show toasts when skills are updated or settings changed')}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      updateSetting(
                        'notificationsEnabled',
                        !settings.notificationsEnabled,
                        settings.notificationsEnabled ? 'Alert toasts disabled' : 'Alert toasts enabled'
                      )
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
                      settings.notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        settings.notificationsEnabled ? 'translate-x-[26px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── 4. Account Section ─── */}
          {activeSection === 'account' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-bold mb-4">
                  {t('accountTitle', 'Profile Information')}
                </h3>

                {currentUser ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt=""
                          className="w-14 h-14 rounded-xl border border-emerald-500/40 object-cover"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-2xl uppercase">
                          {(currentUser.displayName || currentUser.email || 'U')[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-base font-bold text-slate-100">
                          {userProfile?.display_name || currentUser.displayName || 'Learner'}
                        </p>
                        <p className="text-xs text-slate-400">{currentUser.email}</p>
                        <p className="text-[11px] font-mono opacity-60 mt-1">
                          UID: {currentUser.uid}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#30363d]">
                      <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
                        <p className="text-[10px] uppercase font-mono text-slate-400">
                          Provider
                        </p>
                        <p className="text-xs font-semibold text-slate-200 mt-0.5">
                          {currentUser.providerData?.[0]?.providerId === 'google.com' ? 'Google OAuth' : 'Email/Password'}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
                        <p className="text-[10px] uppercase font-mono text-slate-400">
                          MongoDB Atlas
                        </p>
                        <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                          ✓ Document Synchronized
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-3">
                    Sign in to view and synchronize your learning account.
                  </p>
                )}
              </div>

              {currentUser && (
                <div className="border border-red-900/60 rounded-2xl p-6 bg-red-950/20 space-y-3">
                  <h4 className="text-sm font-bold text-red-400">Account Session</h4>
                  <p className="text-xs text-red-300/70">
                    Signing out ends this browser session. Your verified skills and roadmaps remain safely preserved in MongoDB.
                  </p>
                  <button
                    onClick={logout}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/15 border border-red-800/60 text-red-300 hover:bg-red-500/25 transition-colors cursor-pointer"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── 5. About Section ─── */}
          {activeSection === 'about' && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-sm animate-fadeIn space-y-6">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xl font-bold">
                  SF
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-100">
                    SkillForge <span className="text-emerald-400 font-mono text-xs">AI</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    v1.0.0 Production Suite • GitHub Learning Mentor
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed border-t border-[#30363d] pt-4">
                <p>
                  <strong>Architecture:</strong> Deterministic Python scoring engine ($100 \times [0.35\text{vol} + 0.25\text{brd} + 0.25\text{act} + 0.15\text{rec}]$) combined with Google Gemini API structured output generation and pure rule-based fallbacks.
                </p>
                <p>
                  <strong>Security:</strong> OAuth tokens encrypted at rest with Fernet; Google public cert verification on all Firebase JWTs; strict zero-leakage git ignore.
                </p>
              </div>

              {/* Reset All Settings Button */}
              <div className="pt-4 border-t border-[#30363d]">
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="text-xs px-4 py-2 rounded-xl border border-[#30363d] text-slate-400 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
                  >
                    {t('resetSettings', 'Reset All Settings to Default')}
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-300">Are you sure?</span>
                    <button
                      onClick={() => {
                        resetSettings()
                        setShowResetConfirm(false)
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 font-semibold cursor-pointer"
                    >
                      Yes, Reset
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="text-xs px-3 py-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
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

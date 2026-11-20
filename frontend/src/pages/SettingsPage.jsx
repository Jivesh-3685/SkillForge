import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import UserAvatar from '../components/UserAvatar'

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
  const [geminiKeyInput, setGeminiKeyInput] = useState('')
  const [geminiStatus, setGeminiStatus] = useState(null)
  const [geminiSaving, setGeminiSaving] = useState(false)
  const [geminiMsg, setGeminiMsg] = useState('')
  const { idToken } = useAuth()

  const fetchGeminiStatus = async () => {
    if (!idToken) return
    try {
      const res = await fetch('/api/mentor/status', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setGeminiStatus(data)
      }
    } catch {}
  }

  const handleSaveGeminiKey = async (e) => {
    e.preventDefault()
    if (!geminiKeyInput.trim() || !idToken) return
    try {
      setGeminiSaving(true)
      const res = await fetch('/api/mentor/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ api_key: geminiKeyInput.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to save key')
      setGeminiMsg('✓ Google Gemini API key saved and activated!')
      fetchGeminiStatus()
      setGeminiKeyInput('')
    } catch (err) {
      setGeminiMsg('Error: ' + err.message)
    } finally {
      setGeminiSaving(false)
    }
  }

  const handleRemoveGeminiKey = async () => {
    if (!idToken || !confirm('Remove saved Gemini API key?')) return
    try {
      await fetch('/api/mentor/api-key', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      })
      fetchGeminiStatus()
      setGeminiMsg('API key removed.')
    } catch {}
  }

  const sections = [
    { id: 'appearance', icon: '🎨', label: t('tabAppearance', 'Appearance') },
    { id: 'gemini', icon: '✨', label: 'Google Gemini AI' },
    { id: 'language', icon: '🌐', label: t('tabLanguage', 'Language & Region') },
    { id: 'preferences', icon: '🔧', label: t('tabPreferences', 'Preferences') },
    { id: 'account', icon: '👤', label: t('tabAccount', 'Account') },
    { id: 'about', icon: 'ℹ️', label: t('tabAbout', 'About') },
  ]

  return (
    <div className="space-y-6 text-[#37352F]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#37352F]">
          {t('settingsTitle', 'Settings')}
        </h1>
        <p className="text-xs text-[#787774] mt-1">
          {t('settingsSubtitle', 'Customize your SkillForge AI workspace')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation Sidebar */}
        <div className="lg:w-60 shrink-0 bg-[#F7F7F5] border border-[#E9E9E7] rounded-md p-1.5 lg:sticky lg:top-16 self-start shadow-none">
          <nav className="space-y-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left text-xs transition-colors cursor-pointer ${
                  activeSection === s.id
                    ? 'bg-white border border-[#E9E9E7] text-[#37352F] font-semibold'
                    : 'text-[#787774] hover:text-[#37352F] hover:bg-[#E9E9E7]/50'
                }`}
              >
                <span className="text-sm">{s.icon}</span>
                <span>{s.label}</span>
                {activeSection === s.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2383E2]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* ─── 1. Appearance Section ─── */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Selector */}
              <div className="bg-white border border-[#E9E9E7] rounded-md p-6 shadow-none">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-[#37352F]">
                    {t('themeLabel', 'Theme')}
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E9E9E7] text-[#787774]">
                    Active: {THEMES[settings.theme]?.name || 'Notion'}
                  </span>
                </div>
                <p className="text-xs mb-5 text-[#787774]">
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
                        className={`relative p-3.5 rounded-md border-2 transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'border-[#2383E2] bg-white shadow-none'
                            : 'border-[#E9E9E7] bg-[#F7F7F5] hover:border-[#787774]'
                        }`}
                      >
                        {/* Theme Preview Color Swatches */}
                        <div className="flex gap-1.5 mb-2.5">
                          <div
                            className="w-5 h-5 rounded border border-[#E9E9E7]"
                            style={{ backgroundColor: tItem.colors.bgMain }}
                            title="Main Background"
                          />
                          <div
                            className="w-5 h-5 rounded border border-[#E9E9E7]"
                            style={{ backgroundColor: tItem.colors.bgCard }}
                            title="Card Surface"
                          />
                          <div
                            className="w-5 h-5 rounded border border-[#E9E9E7]"
                            style={{ backgroundColor: tItem.colors.bgSidebar }}
                            title="Sidebar Surface"
                          />
                        </div>

                        <p className="text-xs font-semibold text-[#37352F]">
                          {tItem.name}
                        </p>
                        <p className="text-[11px] mt-0.5 text-[#787774]">
                          {tItem.description}
                        </p>

                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#2383E2] text-white flex items-center justify-center text-[9px] font-bold">
                            ✓
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Accent Color */}
              <div className="bg-white border border-[#E9E9E7] rounded-md p-6 shadow-none">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-[#37352F]">
                    {t('accentLabel', 'Accent Color')}
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E9E9E7] text-[#787774]">
                    Active: {ACCENT_MAP[settings.accentColor]?.name || 'Notion Blue'}
                  </span>
                </div>
                <p className="text-xs mb-5 text-[#787774]">
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
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#2383E2] bg-white'
                            : 'border-[#E9E9E7] bg-[#F7F7F5] hover:border-[#787774]'
                        }`}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0"
                          style={{ backgroundColor: acc.primary }}
                        />
                        <span className="text-xs font-medium text-[#37352F]">
                          {acc.name}
                        </span>
                        {isSelected && (
                          <span className="ml-auto text-xs font-bold text-[#2383E2]">
                            ✓
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Font Size */}
              <div className="bg-white border border-[#E9E9E7] rounded-md p-6 shadow-none">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-[#37352F]">
                    {t('fontSizeLabel', 'Font Size')}
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E9E9E7] text-[#787774]">
                    Scale: {settings.fontSize || 'normal'}
                  </span>
                </div>
                <p className="text-xs mb-5 text-[#787774]">
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
                        className={`p-3.5 rounded-md border-2 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'border-[#2383E2] bg-white'
                            : 'border-[#E9E9E7] bg-[#F7F7F5] hover:border-[#787774]'
                        }`}
                      >
                        <span
                          className="font-bold text-[#37352F]"
                          style={{ fontSize: f.basePx }}
                        >
                          {f.sample}
                        </span>
                        <span className="text-xs text-[#787774] mt-0.5">
                          {f.label} ({f.basePx})
                        </span>
                        {isSelected && (
                          <span className="text-[10px] text-[#2383E2] font-semibold">
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

          {/* ─── Google Gemini AI Section ─── */}
          {activeSection === 'gemini' && (
            <div className="bg-white border border-[#E9E9E7] rounded-md p-6 shadow-none space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#37352F] flex items-center gap-2">
                    <span>✨</span> Google Gemini AI Integration
                  </h3>
                  <p className="text-xs text-[#787774] mt-1">
                    Powers the AI Mentor for open-ended queries and contextual roadmap mentoring.
                  </p>
                </div>
                <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full border self-start sm:self-auto ${
                  geminiStatus?.has_gemini_key
                    ? 'bg-[#DBEDDB] text-[#1c3829] border-[#c2e2c2]'
                    : 'bg-[#FDECC8] text-[#402f1d] border-[#fae0a6]'
                }`}>
                  {geminiStatus?.has_gemini_key ? '✓ Active (gemini-1.5-flash)' : '⚠️ Key Not Configured'}
                </span>
              </div>

              {geminiMsg && (
                <div className={`p-3 rounded-md text-xs border ${
                  geminiMsg.startsWith('Error')
                    ? 'bg-[#FFE2DD] border-[#f5c6cb] text-[#5d1715]'
                    : 'bg-[#DBEDDB] border-[#c2e2c2] text-[#1c3829]'
                }`}>
                  {geminiMsg}
                </div>
              )}

              {/* Free Key Tutorial Box */}
              <div className="p-4 bg-[#F7F7F5] rounded-md border border-[#E9E9E7] text-xs space-y-2 text-[#37352F]">
                <p className="font-semibold text-[#37352F]">How to get your free Google Gemini API Key:</p>
                <ol className="list-decimal list-inside space-y-1 text-[#787774]">
                  <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[#2383E2] underline font-medium">Google AI Studio</a></li>
                  <li>Click <strong>Create API Key</strong></li>
                  <li>Paste the key below and click <strong>Activate Google AI</strong></li>
                </ol>
              </div>

              {/* Key Form */}
              <form onSubmit={handleSaveGeminiKey} className="space-y-3">
                <label className="text-xs font-semibold text-[#37352F] block">
                  Gemini API Key:
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    placeholder={geminiStatus?.has_gemini_key ? '••••••••••••••••••••••••' : 'AIzaSy...'}
                    className="flex-1 px-3 py-2 bg-[#F7F7F5] border border-[#E9E9E7] focus:bg-white focus:border-[#2383E2] rounded-md text-xs text-[#37352F] placeholder-[#787774] font-mono focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={geminiSaving || !geminiKeyInput.trim()}
                    className="px-4 py-2 bg-[#2383E2] hover:bg-[#1d6fc2] disabled:opacity-40 text-white font-medium rounded-md text-xs transition-colors cursor-pointer"
                  >
                    {geminiSaving ? 'Saving…' : 'Activate Google AI'}
                  </button>
                </div>
              </form>

              {geminiStatus?.has_gemini_key && (
                <div className="pt-2 flex justify-between items-center border-t border-[#E9E9E7]">
                  <span className="text-xs text-[#787774]">
                    Key is safely stored in your authenticated user profile.
                  </span>
                  <button
                    onClick={handleRemoveGeminiKey}
                    className="text-xs text-[#5d1715] hover:bg-[#FFE2DD] px-3 py-1.5 rounded-md border border-[#f5c6cb] bg-white transition-colors cursor-pointer font-medium"
                  >
                    Remove Key
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── 2. Language & Region Section ─── */}
          {activeSection === 'language' && (
            <div className="bg-white border border-[#E9E9E7] rounded-md p-6 shadow-none space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-[#37352F]">
                  {t('languageLabel', 'Display Language')}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F7F7F5] border border-[#E9E9E7] text-[#787774]">
                  Current: {LANGUAGES.find((l) => l.code === settings.language)?.name || 'English'}
                </span>
              </div>
              <p className="text-xs mb-5 text-[#787774]">
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
                      className={`flex items-center gap-3 p-3.5 rounded-md border-2 transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'border-[#2383E2] bg-white'
                          : 'border-[#E9E9E7] bg-[#F7F7F5] hover:border-[#787774]'
                      }`}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#37352F]">
                          {lang.name}
                        </p>
                        <p className="text-[11px] text-[#787774] font-mono">
                          {lang.native}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="ml-auto w-4 h-4 rounded-full bg-[#2383E2] text-white flex items-center justify-center text-[9px] font-bold">
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
            <div className="bg-white border border-[#E9E9E7] rounded-md p-6 shadow-none space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-[#37352F]">
                  {t('prefTitle', 'Interface Preferences')}
                </h3>
                <p className="text-xs mt-0.5 text-[#787774]">
                  {t('prefDesc', 'Fine-tune interface density and visual behavior')}
                </p>
              </div>

              <div className="divide-y divide-[#E9E9E7]">
                {/* Compact Mode */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#37352F]">
                      {t('compactMode', 'Compact Mode')}
                    </p>
                    <p className="text-xs text-[#787774] mt-0.5">
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
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                      settings.compactMode ? 'bg-[#2383E2]' : 'bg-[#E9E9E7]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        settings.compactMode ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* Smooth Animations */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#37352F]">
                      {t('animations', 'Smooth Animations')}
                    </p>
                    <p className="text-xs text-[#787774] mt-0.5">
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
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                      settings.animationsEnabled ? 'bg-[#2383E2]' : 'bg-[#E9E9E7]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        settings.animationsEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {/* In-App Notifications */}
                <div className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#37352F]">
                      {t('notifications', 'In-App Alerts')}
                    </p>
                    <p className="text-xs text-[#787774] mt-0.5">
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
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${
                      settings.notificationsEnabled ? 'bg-[#2383E2]' : 'bg-[#E9E9E7]'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                        settings.notificationsEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── 4. Account Section ─── */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#E9E9E7] rounded-md p-6 shadow-none">
                <h3 className="text-sm font-semibold text-[#37352F] mb-4">
                  {t('accountTitle', 'Profile Information')}
                </h3>

                {currentUser ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <UserAvatar user={currentUser} size="xl" />
                      <div>
                        <p className="text-sm font-semibold text-[#37352F]">
                          {userProfile?.display_name || currentUser.displayName || 'Learner'}
                        </p>
                        <p className="text-xs text-[#787774]">{currentUser.email}</p>
                        <p className="text-[11px] font-mono text-[#787774] mt-1">
                          UID: {currentUser.uid}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E9E9E7]">
                      <div className="p-3 rounded-md bg-[#F7F7F5] border border-[#E9E9E7]">
                        <p className="text-[10px] uppercase font-mono text-[#787774]">
                          Provider
                        </p>
                        <p className="text-xs font-medium text-[#37352F] mt-0.5">
                          {currentUser.providerData?.[0]?.providerId === 'google.com' ? 'Google OAuth' : 'Email/Password'}
                        </p>
                      </div>
                      <div className="p-3 rounded-md bg-[#F7F7F5] border border-[#E9E9E7]">
                        <p className="text-[10px] uppercase font-mono text-[#787774]">
                          Database Storage
                        </p>
                        <p className="text-xs font-semibold text-[#0F7B6C] mt-0.5">
                          ✓ Supabase PostgreSQL
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#787774] py-3">
                    Sign in to view and synchronize your learning account.
                  </p>
                )}
              </div>

              {currentUser && (
                <div className="border border-[#f5c6cb] rounded-md p-5 bg-[#FFE2DD]/30 space-y-3">
                  <h4 className="text-xs font-semibold text-[#5d1715]">Account Session</h4>
                  <p className="text-xs text-[#5d1715]/80">
                    Signing out ends this browser session. Your verified skills and roadmaps remain safely preserved in Supabase.
                  </p>
                  <button
                    onClick={logout}
                    className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-[#FFE2DD] border border-[#f5c6cb] text-[#5d1715] hover:bg-[#ffd2cc] transition-colors cursor-pointer"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── 5. About Section ─── */}
          {activeSection === 'about' && (
            <div className="bg-white border border-[#E9E9E7] rounded-md p-6 shadow-none space-y-6">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-md p-0.5 flex-shrink-0 bg-[#F7F7F5] border border-[#E9E9E7]">
                  <img
                    src="/logo.png"
                    alt="SkillForge AI Logo"
                    className="w-full h-full rounded object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#37352F]">
                    SkillForge <span className="text-[#2383E2] font-mono text-xs">AI</span>
                  </h3>
                  <p className="text-xs text-[#787774]">
                    v1.0.0 Production Suite • GitHub Learning Mentor
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#787774] leading-relaxed border-t border-[#E9E9E7] pt-4">
                <p>
                  <strong className="text-[#37352F]">Architecture:</strong> Deterministic Python scoring engine ($100 \times [0.35\text{vol} + 0.25\text{brd} + 0.25\text{act} + 0.15\text{rec}]$) combined with Google Gemini API structured output generation and pure rule-based fallbacks.
                </p>
                <p>
                  <strong className="text-[#37352F]">Security:</strong> OAuth tokens encrypted at rest with Fernet; Google public cert verification on all Firebase JWTs; strict zero-leakage git ignore.
                </p>
              </div>

              {/* Reset All Settings Button */}
              <div className="pt-4 border-t border-[#E9E9E7]">
                {!showResetConfirm ? (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="text-xs px-3 py-1.5 rounded-md border border-[#E9E9E7] text-[#787774] hover:text-[#37352F] hover:bg-[#F7F7F5] transition-colors cursor-pointer"
                  >
                    {t('resetSettings', 'Reset All Settings to Default')}
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#37352F]">Are you sure?</span>
                    <button
                      onClick={() => {
                        resetSettings()
                        setShowResetConfirm(false)
                      }}
                      className="text-xs px-3 py-1 rounded-md bg-[#FFE2DD] border border-[#f5c6cb] text-[#5d1715] hover:bg-[#ffd2cc] font-medium cursor-pointer"
                    >
                      Yes, Reset
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="text-xs px-3 py-1 rounded-md text-[#787774] hover:text-[#37352F] cursor-pointer"
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

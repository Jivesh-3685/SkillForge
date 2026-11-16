import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const ThemeContext = createContext(null)

const THEMES = {
  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Default dark mode',
    bg: 'bg-[#0e0e10]',
    sidebar: 'bg-[#1a1a1f]',
    card: 'bg-[#161b22]',
    border: 'border-[#2a2a32]',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    accent: 'emerald',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Blue',
    description: 'Deep blue tones',
    bg: 'bg-[#0a0e1a]',
    sidebar: 'bg-[#111827]',
    card: 'bg-[#1e293b]',
    border: 'border-[#1e3a5f]',
    text: 'text-blue-50',
    textMuted: 'text-blue-300/60',
    accent: 'blue',
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Earthy green tones',
    bg: 'bg-[#0a120e]',
    sidebar: 'bg-[#0f1a14]',
    card: 'bg-[#162118]',
    border: 'border-[#1a3a25]',
    text: 'text-green-50',
    textMuted: 'text-green-300/60',
    accent: 'green',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm amber tones',
    bg: 'bg-[#12090a]',
    sidebar: 'bg-[#1a0e0f]',
    card: 'bg-[#221516]',
    border: 'border-[#3a1a1c]',
    text: 'text-orange-50',
    textMuted: 'text-orange-300/60',
    accent: 'amber',
  },
  light: {
    id: 'light',
    name: 'Light',
    description: 'Clean light mode',
    bg: 'bg-[#f5f5f5]',
    sidebar: 'bg-white',
    card: 'bg-white',
    border: 'border-gray-200',
    text: 'text-gray-900',
    textMuted: 'text-gray-500',
    accent: 'emerald',
  },
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
]

const ACCENT_COLORS = [
  { id: 'emerald', name: 'Emerald', class: 'bg-emerald-500' },
  { id: 'blue', name: 'Blue', class: 'bg-blue-500' },
  { id: 'violet', name: 'Violet', class: 'bg-violet-500' },
  { id: 'rose', name: 'Rose', class: 'bg-rose-500' },
  { id: 'amber', name: 'Amber', class: 'bg-amber-500' },
  { id: 'cyan', name: 'Cyan', class: 'bg-cyan-500' },
  { id: 'green', name: 'Green', class: 'bg-green-500' },
  { id: 'orange', name: 'Orange', class: 'bg-orange-500' },
]

const DEFAULT_SETTINGS = {
  theme: 'dark',
  language: 'en',
  accentColor: 'emerald',
  sidebarCollapsed: false,
  compactMode: false,
  showPhaseLabels: true,
  animationsEnabled: true,
  notificationsEnabled: true,
  fontSize: 'normal', // 'small' | 'normal' | 'large'
}

const STORAGE_KEY = 'skillforge-settings'

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {}
  }, [settings])

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
  }, [])

  const theme = THEMES[settings.theme] || THEMES.dark
  const accent = settings.accentColor || theme.accent

  return (
    <ThemeContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        theme,
        accent,
        THEMES,
        LANGUAGES,
        ACCENT_COLORS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

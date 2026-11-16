import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { TRANSLATIONS } from '../i18n/translations'

const ThemeContext = createContext(null)

export const THEMES = {
  dark: {
    id: 'dark',
    name: 'Dark (Default)',
    description: 'Clean obsidian and slate dark theme',
    colors: {
      bgMain: '#0e0e10',
      bgCard: '#161b22',
      bgCardHover: '#1c2128',
      bgSidebar: '#14181f',
      bgInput: '#0d1117',
      borderColor: '#30363d',
      textMain: '#f0f6fc',
      textMuted: '#8b949e',
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Blue',
    description: 'Deep navy, indigo & cobalt tones',
    colors: {
      bgMain: '#070b14',
      bgCard: '#0f172a',
      bgCardHover: '#1e293b',
      bgSidebar: '#0b1120',
      bgInput: '#050811',
      borderColor: '#1e3a5f',
      textMain: '#e2e8f0',
      textMuted: '#94a3b8',
    },
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Earthy emerald, sage & pine dark tones',
    colors: {
      bgMain: '#08100c',
      bgCard: '#0f1f17',
      bgCardHover: '#162d22',
      bgSidebar: '#0b1711',
      bgInput: '#050a08',
      borderColor: '#1d432e',
      textMain: '#e6f4ea',
      textMuted: '#8fa899',
    },
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm mahogany, amber & charcoal',
    colors: {
      bgMain: '#120a0d',
      bgCard: '#1e1216',
      bgCardHover: '#2d1b22',
      bgSidebar: '#170d11',
      bgInput: '#0a0507',
      borderColor: '#3f1f28',
      textMain: '#faebd7',
      textMuted: '#bda6ad',
    },
  },
  light: {
    id: 'light',
    name: 'Clean Light',
    description: 'Minimalist crisp high-contrast light theme',
    colors: {
      bgMain: '#f4f6f8',
      bgCard: '#ffffff',
      bgCardHover: '#f8fafc',
      bgSidebar: '#ffffff',
      bgInput: '#f1f5f9',
      borderColor: '#e2e8f0',
      textMain: '#0f172a',
      textMuted: '#64748b',
    },
  },
}

export const ACCENT_MAP = {
  emerald: { id: 'emerald', name: 'Emerald', primary: '#10b981', hover: '#059669', soft: 'rgba(16, 185, 129, 0.16)', text: '#34d399', bgClass: 'bg-emerald-500' },
  blue: { id: 'blue', name: 'Blue', primary: '#3b82f6', hover: '#2563eb', soft: 'rgba(59, 130, 246, 0.16)', text: '#60a5fa', bgClass: 'bg-blue-500' },
  violet: { id: 'violet', name: 'Violet', primary: '#8b5cf6', hover: '#7c3aed', soft: 'rgba(139, 92, 246, 0.16)', text: '#a78bfa', bgClass: 'bg-violet-500' },
  rose: { id: 'rose', name: 'Rose', primary: '#f43f5e', hover: '#e11d48', soft: 'rgba(244, 63, 94, 0.16)', text: '#fb7185', bgClass: 'bg-rose-500' },
  amber: { id: 'amber', name: 'Amber', primary: '#f59e0b', hover: '#d97706', soft: 'rgba(245, 158, 11, 0.16)', text: '#fbbf24', bgClass: 'bg-amber-500' },
  cyan: { id: 'cyan', name: 'Cyan', primary: '#06b6d4', hover: '#0891b2', soft: 'rgba(6, 182, 212, 0.16)', text: '#22d3ee', bgClass: 'bg-cyan-500' },
  green: { id: 'green', name: 'Green', primary: '#22c55e', hover: '#16a34a', soft: 'rgba(34, 197, 94, 0.16)', text: '#4ade80', bgClass: 'bg-green-500' },
  orange: { id: 'orange', name: 'Orange', primary: '#f97316', hover: '#ea580c', soft: 'rgba(249, 115, 22, 0.16)', text: '#fb923c', bgClass: 'bg-orange-500' },
}

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', native: 'हिन्दी' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', native: 'Español' },
  { code: 'fr', name: 'French', flag: '🇫🇷', native: 'Français' },
  { code: 'de', name: 'German', flag: '🇩🇪', native: 'Deutsch' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', native: '日本語' },
]

export const FONT_SIZES = [
  { id: 'small', label: 'Small', basePx: '13px', sample: 'Aa' },
  { id: 'normal', label: 'Normal', basePx: '14.5px', sample: 'Aa' },
  { id: 'large', label: 'Large', basePx: '16px', sample: 'Aa' },
]

const DEFAULT_SETTINGS = {
  theme: 'dark',
  language: 'en',
  accentColor: 'emerald',
  fontSize: 'normal',
  sidebarCollapsed: false,
  sidebarWidth: 260,
  compactMode: false,
  showPhaseLabels: true,
  animationsEnabled: true,
  notificationsEnabled: true,
}

const STORAGE_KEY = 'skillforge-settings-v2'

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  const [toastMessage, setToastMessage] = useState('')

  // Translation helper function
  const t = useCallback(
    (key, fallback = '') => {
      const lang = settings.language || 'en'
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.en
      return dict[key] || TRANSLATIONS.en[key] || fallback || key
    },
    [settings.language]
  )

  // Apply CSS Variables directly to document.documentElement
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {}

    const root = document.documentElement
    const currentTheme = THEMES[settings.theme] || THEMES.dark
    const currentAccent = ACCENT_MAP[settings.accentColor] || ACCENT_MAP.emerald
    const currentFontSize = FONT_SIZES.find((f) => f.id === settings.fontSize) || FONT_SIZES[1]

    // Set attributes for CSS hooks
    root.setAttribute('data-theme', settings.theme)
    root.setAttribute('data-accent', settings.accentColor)
    root.setAttribute('data-compact', settings.compactMode ? 'true' : 'false')
    root.setAttribute('data-animations', settings.animationsEnabled ? 'true' : 'false')

    // Theme colors
    root.style.setProperty('--bg-main', currentTheme.colors.bgMain)
    root.style.setProperty('--bg-card', currentTheme.colors.bgCard)
    root.style.setProperty('--bg-card-hover', currentTheme.colors.bgCardHover)
    root.style.setProperty('--bg-sidebar', currentTheme.colors.bgSidebar)
    root.style.setProperty('--bg-input', currentTheme.colors.bgInput)
    root.style.setProperty('--border-color', currentTheme.colors.borderColor)
    root.style.setProperty('--text-main', currentTheme.colors.textMain)
    root.style.setProperty('--text-muted', currentTheme.colors.textMuted)

    // Accent colors
    root.style.setProperty('--accent-primary', currentAccent.primary)
    root.style.setProperty('--accent-hover', currentAccent.hover)
    root.style.setProperty('--accent-soft', currentAccent.soft)
    root.style.setProperty('--accent-text', currentAccent.text)

    // Typography
    root.style.setProperty('--font-size-base', currentFontSize.basePx)
    root.style.fontSize = currentFontSize.basePx
  }, [settings])

  const showToast = useCallback((msg) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage('')
    }, 2800)
  }, [])

  const updateSetting = useCallback((key, value, toastText = '') => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      return next
    })

    if (toastText) {
      showToast(toastText)
    }
  }, [showToast])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    showToast('✓ Settings reset to default values')
  }, [showToast])

  const theme = THEMES[settings.theme] || THEMES.dark
  const accent = ACCENT_MAP[settings.accentColor] || ACCENT_MAP.emerald

  return (
    <ThemeContext.Provider
      value={{
        settings,
        updateSetting,
        resetSettings,
        theme,
        accent,
        t,
        THEMES,
        ACCENT_MAP,
        LANGUAGES,
        FONT_SIZES,
      }}
    >
      {children}

      {/* Floating feedback toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl border border-white/20 bg-slate-900/90 text-white text-xs font-medium backdrop-blur-md animate-fadeIn">
          <span>{toastMessage}</span>
        </div>
      )}
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

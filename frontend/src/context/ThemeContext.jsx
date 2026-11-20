import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { TRANSLATIONS } from '../i18n/translations'

const ThemeContext = createContext(null)

export const THEMES = {
  notion: {
    id: 'notion',
    name: 'Notion Minimal (Default)',
    description: 'Crisp white canvas with warm off-white surfaces & paper-like 2D feel',
    colors: {
      bgMain: '#FFFFFF',
      bgCard: '#FFFFFF',
      bgCardHover: 'rgba(55, 53, 47, 0.04)',
      bgSidebar: '#F7F7F5',
      bgInput: '#F7F7F5',
      borderColor: '#E9E9E7',
      textMain: '#37352F',
      textMuted: '#787774',
    },
  },
  warm: {
    id: 'warm',
    name: 'Notion Warm Paper',
    description: 'Subtle warm-tinted canvas with off-white callouts',
    colors: {
      bgMain: '#FBFBFA',
      bgCard: '#FFFFFF',
      bgCardHover: 'rgba(55, 53, 47, 0.04)',
      bgSidebar: '#F7F7F5',
      bgInput: '#F7F7F5',
      borderColor: '#E9E9E7',
      textMain: '#37352F',
      textMuted: '#787774',
    },
  },
  light: {
    id: 'light',
    name: 'Notion Pure White',
    description: 'Minimalist high-contrast pure white palette',
    colors: {
      bgMain: '#FFFFFF',
      bgCard: '#F7F7F5',
      bgCardHover: 'rgba(55, 53, 47, 0.06)',
      bgSidebar: '#FFFFFF',
      bgInput: '#FFFFFF',
      borderColor: '#E9E9E7',
      textMain: '#37352F',
      textMuted: '#787774',
    },
  },
  dark: {
    id: 'dark',
    name: 'Notion Dark',
    description: 'Authentic Notion dark mode with deep warm charcoal surfaces',
    colors: {
      bgMain: '#191919',
      bgCard: '#202020',
      bgCardHover: 'rgba(255, 255, 255, 0.04)',
      bgSidebar: '#202020',
      bgInput: '#262626',
      borderColor: '#2F2F2F',
      textMain: '#E3E2DE',
      textMuted: '#9B9A97',
    },
  },
}

export const ACCENT_MAP = {
  blue: { id: 'blue', name: 'Notion Blue', primary: '#2383E2', hover: '#1b6ec2', soft: 'rgba(35, 131, 226, 0.1)', text: '#2383E2', bgClass: 'bg-[#2383E2]' },
  emerald: { id: 'emerald', name: 'Sage Green', primary: '#0F7B6C', hover: '#0b5f54', soft: 'rgba(15, 123, 108, 0.1)', text: '#0F7B6C', bgClass: 'bg-[#0F7B6C]' },
  violet: { id: 'violet', name: 'Purple', primary: '#6940A5', hover: '#533185', soft: 'rgba(105, 64, 165, 0.1)', text: '#6940A5', bgClass: 'bg-[#6940A5]' },
  rose: { id: 'rose', name: 'Dusty Pink', primary: '#DF5452', hover: '#c24240', soft: 'rgba(223, 84, 82, 0.1)', text: '#DF5452', bgClass: 'bg-[#DF5452]' },
  amber: { id: 'amber', name: 'Warm Amber', primary: '#D9730D', hover: '#ba6007', soft: 'rgba(217, 115, 13, 0.1)', text: '#D9730D', bgClass: 'bg-[#D9730D]' },
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
  theme: 'notion',
  language: 'en',
  accentColor: 'blue',
  fontSize: 'normal',
  sidebarCollapsed: false,
  sidebarWidth: 260,
  compactMode: false,
  showPhaseLabels: false,
  animationsEnabled: true,
  notificationsEnabled: true,
}

const STORAGE_KEY = 'skillforge-settings-v3'

export function ThemeProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      // Purge stale dark theme keys from earlier versions
      localStorage.removeItem('skillforge-settings')
      localStorage.removeItem('skillforge-settings-v1')
      localStorage.removeItem('skillforge-settings-v2')

      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Ensure theme is a valid modern Notion theme
        if (!parsed.theme || !THEMES[parsed.theme]) {
          parsed.theme = 'notion'
        }
        return { ...DEFAULT_SETTINGS, ...parsed, showPhaseLabels: false }
      }
      return DEFAULT_SETTINGS
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
    const currentTheme = THEMES[settings.theme] || THEMES.notion
    const currentAccent = ACCENT_MAP[settings.accentColor] || ACCENT_MAP.blue
    const currentFontSize = FONT_SIZES.find((f) => f.id === settings.fontSize) || FONT_SIZES[1]

    // Set attributes for CSS hooks
    root.setAttribute('data-theme', settings.theme)
    root.setAttribute('data-accent', settings.accentColor)
    root.setAttribute('data-compact', settings.compactMode ? 'true' : 'false')
    root.setAttribute('data-animations', settings.animationsEnabled ? 'true' : 'false')

    // Theme surface & text colors
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
    showToast('✓ Settings reset to Notion default values')
  }, [showToast])

  const theme = THEMES[settings.theme] || THEMES.notion
  const accent = ACCENT_MAP[settings.accentColor] || ACCENT_MAP.blue

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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-md shadow-md border border-[#222] bg-[#37352F] text-white text-xs font-medium animate-fadeIn">
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

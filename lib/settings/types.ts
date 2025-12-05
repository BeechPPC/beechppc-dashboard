/**
 * Settings types for application configuration
 */

export interface ColorScheme {
  name: string
  primary: string
  primaryLight: string
  primaryMid: string
  primaryDark: string
  background: string
  surface: string
  foreground: string
  muted: string
  success: string
  error: string
  warning: string
  border: string
  ring: string
}

export interface AppSettings {
  // Branding settings
  companyName?: string
  logoUrl?: string
  logoFileName?: string
  faviconUrl?: string
  faviconFileName?: string

  // Appearance settings
  colorScheme: string // Name of the active color scheme
  customColors?: ColorScheme // Custom color scheme if user creates one
  fontFamily?: string // Selected font family
  themeMode?: 'light' | 'dark' | 'system' // Dark mode preference
  dashboardLayout?: 'compact' | 'spacious' // Dashboard density

  // Report settings
  schedule?: string
  timezone?: string
  recipients?: string

  // Metadata
  updatedAt: string
}

// Predefined color schemes
export const COLOR_SCHEMES: Record<string, ColorScheme> = {
  'beech-yellow': {
    name: 'Beech Yellow (Default)',
    primary: '#f59e0b',
    primaryLight: '#fef3c7',
    primaryMid: '#fde68a',
    primaryDark: '#fbbf24',
    background: '#fefce8',
    surface: '#ffffff',
    foreground: '#111827',
    muted: '#4b5563',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    border: '#fde68a',
    ring: '#f59e0b',
  },
  'ocean-blue': {
    name: 'Ocean Blue',
    primary: '#0ea5e9',
    primaryLight: '#e0f2fe',
    primaryMid: '#bae6fd',
    primaryDark: '#38bdf8',
    background: '#f0f9ff',
    surface: '#ffffff',
    foreground: '#111827',
    muted: '#4b5563',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    border: '#bae6fd',
    ring: '#0ea5e9',
  },
  'forest-green': {
    name: 'Forest Green',
    primary: '#10b981',
    primaryLight: '#d1fae5',
    primaryMid: '#a7f3d0',
    primaryDark: '#34d399',
    background: '#ecfdf5',
    surface: '#ffffff',
    foreground: '#111827',
    muted: '#4b5563',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    border: '#a7f3d0',
    ring: '#10b981',
  },
  'royal-purple': {
    name: 'Royal Purple',
    primary: '#8b5cf6',
    primaryLight: '#ede9fe',
    primaryMid: '#ddd6fe',
    primaryDark: '#a78bfa',
    background: '#faf5ff',
    surface: '#ffffff',
    foreground: '#111827',
    muted: '#4b5563',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    border: '#ddd6fe',
    ring: '#8b5cf6',
  },
  'sunset-orange': {
    name: 'Sunset Orange',
    primary: '#f97316',
    primaryLight: '#ffedd5',
    primaryMid: '#fed7aa',
    primaryDark: '#fb923c',
    background: '#fff7ed',
    surface: '#ffffff',
    foreground: '#111827',
    muted: '#4b5563',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f97316',
    border: '#fed7aa',
    ring: '#f97316',
  },
  'slate-gray': {
    name: 'Slate Gray',
    primary: '#64748b',
    primaryLight: '#f1f5f9',
    primaryMid: '#e2e8f0',
    primaryDark: '#94a3b8',
    background: '#f8fafc',
    surface: '#ffffff',
    foreground: '#0f172a',
    muted: '#475569',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    border: '#e2e8f0',
    ring: '#64748b',
  },
}

// Dark mode color schemes
export const DARK_COLOR_SCHEMES: Record<string, ColorScheme> = {
  'beech-yellow': {
    name: 'Beech Yellow (Dark)',
    primary: '#f59e0b',
    primaryLight: '#422006',
    primaryMid: '#78350f',
    primaryDark: '#fbbf24',
    background: '#0f0f0f',
    surface: '#1a1a1a',
    foreground: '#f9fafb',
    muted: '#9ca3af',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    border: '#374151',
    ring: '#f59e0b',
  },
  'ocean-blue': {
    name: 'Ocean Blue (Dark)',
    primary: '#0ea5e9',
    primaryLight: '#082f49',
    primaryMid: '#0c4a6e',
    primaryDark: '#38bdf8',
    background: '#0f0f0f',
    surface: '#1a1a1a',
    foreground: '#f9fafb',
    muted: '#9ca3af',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    border: '#374151',
    ring: '#0ea5e9',
  },
  'forest-green': {
    name: 'Forest Green (Dark)',
    primary: '#10b981',
    primaryLight: '#022c22',
    primaryMid: '#064e3b',
    primaryDark: '#34d399',
    background: '#0f0f0f',
    surface: '#1a1a1a',
    foreground: '#f9fafb',
    muted: '#9ca3af',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    border: '#374151',
    ring: '#10b981',
  },
  'royal-purple': {
    name: 'Royal Purple (Dark)',
    primary: '#8b5cf6',
    primaryLight: '#2e1065',
    primaryMid: '#4c1d95',
    primaryDark: '#a78bfa',
    background: '#0f0f0f',
    surface: '#1a1a1a',
    foreground: '#f9fafb',
    muted: '#9ca3af',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    border: '#374151',
    ring: '#8b5cf6',
  },
  'sunset-orange': {
    name: 'Sunset Orange (Dark)',
    primary: '#f97316',
    primaryLight: '#431407',
    primaryMid: '#7c2d12',
    primaryDark: '#fb923c',
    background: '#0f0f0f',
    surface: '#1a1a1a',
    foreground: '#f9fafb',
    muted: '#9ca3af',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f97316',
    border: '#374151',
    ring: '#f97316',
  },
  'slate-gray': {
    name: 'Slate Gray (Dark)',
    primary: '#94a3b8',
    primaryLight: '#0f172a',
    primaryMid: '#1e293b',
    primaryDark: '#cbd5e1',
    background: '#0f0f0f',
    surface: '#1a1a1a',
    foreground: '#f8fafc',
    muted: '#94a3b8',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    border: '#334155',
    ring: '#94a3b8',
  },
}

// Available font families
export const FONT_FAMILIES = {
  inter: {
    name: 'Inter',
    value: 'var(--font-inter)',
    description: 'Modern and clean (Default)',
  },
  roboto: {
    name: 'Roboto',
    value: 'var(--font-roboto)',
    description: 'Google\'s signature font',
  },
  'open-sans': {
    name: 'Open Sans',
    value: 'var(--font-open-sans)',
    description: 'Friendly and readable',
  },
  montserrat: {
    name: 'Montserrat',
    value: 'var(--font-montserrat)',
    description: 'Bold and geometric',
  },
  'source-sans': {
    name: 'Source Sans Pro',
    value: 'var(--font-source-sans)',
    description: 'Adobe\'s versatile font',
  },
}

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'Beech PPC AI',
  colorScheme: 'beech-yellow',
  fontFamily: 'inter',
  themeMode: 'light',
  dashboardLayout: 'spacious',
  schedule: '0 11 * * *',
  timezone: 'Australia/Melbourne',
  recipients: 'chris@beechppc.com',
  updatedAt: new Date().toISOString(),
}

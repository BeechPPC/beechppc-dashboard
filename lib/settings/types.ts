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
  // Logo settings
  logoUrl?: string
  logoFileName?: string

  // Color scheme settings
  colorScheme: string // Name of the active color scheme
  customColors?: ColorScheme // Custom color scheme if user creates one

  // Existing settings
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

export const DEFAULT_SETTINGS: AppSettings = {
  colorScheme: 'beech-yellow',
  schedule: '0 11 * * *',
  timezone: 'Australia/Melbourne',
  recipients: 'chris@beechppc.com',
  updatedAt: new Date().toISOString(),
}

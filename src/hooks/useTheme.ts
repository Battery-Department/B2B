'use client'

import { useState, useEffect, useCallback } from 'react'
import { themes, type ThemeName, type Theme, createCSSVariables } from '@/lib/constants/theme'

export interface UseThemeReturn {
  theme: Theme
  themeName: ThemeName
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
  isDark: boolean
  isSystemDark: boolean
  preferredTheme: ThemeName | 'system'
  setPreferredTheme: (theme: ThemeName | 'system') => void
}

const STORAGE_KEY = 'battery-department-theme'
const MEDIA_QUERY = '(prefers-color-scheme: dark)'

// Get system theme preference
const getSystemTheme = (): ThemeName => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia(MEDIA_QUERY).matches ? 'dark' : 'light'
}

// Get stored theme preference
const getStoredTheme = (): ThemeName | 'system' => {
  if (typeof window === 'undefined') return 'system'
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error)
  }
  
  return 'system'
}

// Store theme preference
const storeTheme = (theme: ThemeName | 'system') => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch (error) {
    console.warn('Failed to store theme in localStorage:', error)
  }
}

// Apply CSS variables to document
const applyCSSVariables = (theme: Theme) => {
  if (typeof window === 'undefined') return
  
  const variables = createCSSVariables(theme)
  const root = document.documentElement
  
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value)
  })
  
  // Update data attributes for CSS selectors
  root.setAttribute('data-theme', theme.name)
  root.setAttribute('data-dark', theme.isDark.toString())
  
  // Update meta theme-color for mobile browsers
  const themeColorMeta = document.querySelector('meta[name="theme-color"]')
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', theme.colors.background.primary)
  } else {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = theme.colors.background.primary
    document.head.appendChild(meta)
  }
}

// Resolve actual theme from preference
const resolveTheme = (preferred: ThemeName | 'system', systemTheme: ThemeName): ThemeName => {
  return preferred === 'system' ? systemTheme : preferred
}

export const useTheme = (): UseThemeReturn => {
  const [isSystemDark, setIsSystemDark] = useState(getSystemTheme() === 'dark')
  const [preferredTheme, setPreferredThemeState] = useState<ThemeName | 'system'>(() => 
    getStoredTheme()
  )
  
  const systemTheme = isSystemDark ? 'dark' : 'light'
  const themeName = resolveTheme(preferredTheme, systemTheme)
  const theme = themes[themeName]
  
  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const mediaQuery = window.matchMedia(MEDIA_QUERY)
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  // Apply CSS variables when theme changes
  useEffect(() => {
    applyCSSVariables(theme)
    
    // Animate theme transition
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      root.style.transition = 'background-color 0.3s ease, color 0.3s ease'
      
      const cleanup = setTimeout(() => {
        root.style.transition = ''
      }, 300)
      
      return () => clearTimeout(cleanup)
    }
  }, [theme])
  
  const setTheme = useCallback((newTheme: ThemeName) => {
    setPreferredThemeState(newTheme)
    storeTheme(newTheme)
  }, [])
  
  const setPreferredTheme = useCallback((newPreferred: ThemeName | 'system') => {
    setPreferredThemeState(newPreferred)
    storeTheme(newPreferred)
  }, [])
  
  const toggleTheme = useCallback(() => {
    const currentActual = resolveTheme(preferredTheme, systemTheme)
    const newTheme = currentActual === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }, [preferredTheme, systemTheme, setTheme])
  
  return {
    theme,
    themeName,
    setTheme,
    toggleTheme,
    isDark: theme.isDark,
    isSystemDark,
    preferredTheme,
    setPreferredTheme,
  }
}

// Theme provider context (for advanced usage)
import React, { createContext, useContext } from 'react'

const ThemeContext = createContext<UseThemeReturn | null>(null)

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: ThemeName | 'system'
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'system' 
}) => {
  const themeValue = useTheme()
  
  // Initialize with default theme if no stored preference
  React.useEffect(() => {
    if (getStoredTheme() === 'system' && defaultTheme !== 'system') {
      themeValue.setPreferredTheme(defaultTheme)
    }
  }, [defaultTheme, themeValue])
  
  return React.createElement(ThemeContext.Provider, { value: themeValue }, children);
}

export const useThemeContext = (): UseThemeReturn => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }
  return context
}

// Utility hooks for common theme-related operations
export const useIsDark = (): boolean => {
  const { isDark } = useTheme()
  return isDark
}

export const useThemeColors = () => {
  const { theme } = useTheme()
  return theme.colors
}

export const useThemeShadows = () => {
  const { theme } = useTheme()
  return theme.shadows
}

// SSR-safe theme hook (prevents hydration mismatch)
export const useSSRSafeTheme = () => {
  const [mounted, setMounted] = React.useState(false)
  const theme = useTheme()
  
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  // Return light theme during SSR and before hydration
  if (!mounted) {
    return {
      ...theme,
      theme: themes.light,
      themeName: 'light' as ThemeName,
      isDark: false,
    }
  }
  
  return theme
}
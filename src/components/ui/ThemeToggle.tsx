'use client'

import React, { useState } from 'react'
import { Sun, Moon, Monitor, Check, ChevronDown } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { useAnimation } from '@/hooks/useAnimation'
import { Button } from './button'

export interface ThemeToggleProps {
  variant?: 'button' | 'dropdown' | 'switch'
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  className?: string
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'button',
  size = 'md',
  showLabels = false,
  className = '',
}) => {
  const {
    themeName,
    preferredTheme,
    setPreferredTheme,
    toggleTheme,
    isDark,
    isSystemDark,
  } = useTheme()
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { style: iconStyle } = useAnimation('scaleIn', { delay: 100 })

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  }

  const themeOptions = [
    {
      key: 'light' as const,
      label: 'Light',
      icon: Sun,
      description: 'Light theme',
    },
    {
      key: 'dark' as const,
      label: 'Dark',
      icon: Moon,
      description: 'Dark theme',
    },
    {
      key: 'system' as const,
      label: 'System',
      icon: Monitor,
      description: `Follow system (${isSystemDark ? 'dark' : 'light'})`,
    },
  ]

  // Simple toggle button (cycles through light -> dark -> system)
  if (variant === 'button') {
    const currentIcon = isDark ? Moon : Sun
    
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className={`${sizeClasses[size]} ${className} relative overflow-hidden`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      >
        <div
          className="transition-all duration-500 ease-in-out"
          style={{
            ...iconStyle,
            transform: `rotate(${isDark ? '180deg' : '0deg'})`,
          }}
        >
          <currentIcon size={iconSizes[size]} />
        </div>
        
        {/* Animated background */}
        <div
          className="absolute inset-0 rounded-lg transition-all duration-300 ease-in-out"
          style={{
            background: isDark 
              ? 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%)',
            transform: `scale(${isDark ? 1 : 0})`,
          }}
        />
      </Button>
    )
  }

  // Switch toggle
  if (variant === 'switch') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {showLabels && (
          <div className="flex items-center gap-2 text-sm font-medium">
            <Sun size={16} className={!isDark ? 'text-amber-500' : 'text-gray-400'} />
            <span className={!isDark ? 'text-gray-900' : 'text-gray-500'}>Light</span>
          </div>
        )}
        
        <button
          onClick={toggleTheme}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isDark ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={isDark}
          aria-label="Toggle theme"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
              isDark ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        
        {showLabels && (
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className={isDark ? 'text-gray-900' : 'text-gray-500'}>Dark</span>
            <Moon size={16} className={isDark ? 'text-blue-500' : 'text-gray-400'} />
          </div>
        )}
      </div>
    )
  }

  // Dropdown variant (full control including system preference)
  if (variant === 'dropdown') {
    const currentOption = themeOptions.find(option => option.key === preferredTheme) || themeOptions[0]
    const CurrentIcon = currentOption.icon

    return (
      <div className={`relative ${className}`}>
        <Button
          variant="outline"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 min-w-[120px] justify-between"
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
        >
          <div className="flex items-center gap-2">
            <CurrentIcon size={iconSizes[size]} />
            {showLabels && <span>{currentOption.label}</span>}
          </div>
          <ChevronDown 
            size={16} 
            className={`transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`} 
          />
        </Button>

        {/* Dropdown menu */}
        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            
            {/* Menu */}
            <div
              className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden"
              role="listbox"
              style={iconStyle}
            >
              {themeOptions.map((option) => {
                const Icon = option.icon
                const isSelected = preferredTheme === option.key
                
                return (
                  <button
                    key={option.key}
                    onClick={() => {
                      setPreferredTheme(option.key)
                      setIsDropdownOpen(false)
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors duration-150 ${
                      isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <Icon size={20} className={isSelected ? 'text-blue-600' : 'text-gray-500'} />
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-blue-600" />
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  return null
}

// Compact theme toggle for headers/navigation
export const CompactThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme()
  
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? (
        <Sun size={18} className="text-gray-600 dark:text-gray-300" />
      ) : (
        <Moon size={18} className="text-gray-600 dark:text-gray-300" />
      )}
    </button>
  )
}

// Theme toggle with animation for special use cases
export const AnimatedThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)
  
  const handleToggle = () => {
    setIsAnimating(true)
    toggleTheme()
    setTimeout(() => setIsAnimating(false), 600)
  }
  
  return (
    <button
      onClick={handleToggle}
      disabled={isAnimating}
      className={`relative w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 dark:from-blue-600 dark:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {/* Background animation */}
      <div
        className={`absolute inset-0 bg-gradient-to-br transition-all duration-500 ${
          isDark 
            ? 'from-blue-600 to-purple-700 opacity-100' 
            : 'from-amber-400 to-orange-500 opacity-100'
        }`}
      />
      
      {/* Icon container */}
      <div
        className={`absolute inset-2 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center transition-all duration-500 ${
          isAnimating ? 'scale-90 rotate-180' : 'scale-100 rotate-0'
        }`}
      >
        {isDark ? (
          <Moon size={20} className="text-blue-600" />
        ) : (
          <Sun size={20} className="text-amber-500" />
        )}
      </div>
      
      {/* Ripple effect */}
      {isAnimating && (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-full animate-ping opacity-25" />
      )}
    </button>
  )
}
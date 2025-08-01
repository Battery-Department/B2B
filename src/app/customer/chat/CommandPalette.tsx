'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Command {
  id: string
  label: string
  shortcut: string
  format: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onApplyCommand: (command: Command) => void
  isDarkMode?: boolean
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onApplyCommand,
  isDarkMode = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  
  const commands: Command[] = [
    { id: 'bold', label: 'Bold Text', shortcut: 'Ctrl+B', format: '**{selection}**' },
    { id: 'highlight', label: 'Highlight Text', shortcut: 'Ctrl+H', format: '=={selection}==' },
    { id: 'spec', label: 'Technical Specification', shortcut: 'Ctrl+T', format: '{{{selection}}}' },
    { id: 'code', label: 'Code/Value', shortcut: 'Ctrl+`', format: '`{selection}`' },
    { id: 'category', label: 'Category Header', shortcut: 'Ctrl+1', format: '## {selection}' },
    { id: 'bullet', label: 'Bullet Item', shortcut: 'Ctrl+8', format: '* {selection}' },
    { id: 'value', label: 'Numeric Value', shortcut: 'Ctrl+9', format: '!{selection}!' },
    { id: 'product', label: 'Product Name', shortcut: 'Ctrl+P', format: '[{selection}]' },
  ]
  
  const filteredCommands = commands.filter(command => 
    command.label.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])
  
  if (!isOpen) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${isDarkMode ? '#3d3d3d' : '#e5e7eb'}`
      }}>
        <div style={{
          padding: '16px',
          borderBottom: `1px solid ${isDarkMode ? '#3d3d3d' : '#e5e7eb'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <input
            type="text"
            placeholder="Search formatting commands..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: isDarkMode ? '#2d2d2d' : '#f3f4f6',
              border: `1px solid ${isDarkMode ? '#3d3d3d' : '#e0e0e0'}`,
              borderRadius: '6px',
              fontSize: '14px',
              color: isDarkMode ? '#ffffff' : '#000000',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#0b6e99'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = isDarkMode ? '#3d3d3d' : '#e0e0e0'
            }}
          />
          <button
            onClick={onClose}
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: isDarkMode ? '#9ca3af' : '#6b7280',
              transition: 'all 0.1s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = isDarkMode ? '#374151' : '#f3f4f6'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <X size={20} />
          </button>
        </div>
        
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px'
        }}>
          {filteredCommands.map(command => (
            <button
              key={command.id}
              onClick={() => {
                onApplyCommand(command)
                onClose()
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 12px',
                marginBottom: '4px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.1s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = isDarkMode ? '#2d2d2d' : '#f3f4f6'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <span style={{
                fontSize: '14px',
                fontWeight: 500,
                color: isDarkMode ? '#ffffff' : '#111827'
              }}>
                {command.label}
              </span>
              <span style={{
                fontSize: '12px',
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {command.shortcut}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CommandPalette
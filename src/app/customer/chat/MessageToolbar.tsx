'use client'

import React from 'react'
import { Lightbulb, Copy, Maximize2, Minimize2, Check } from 'lucide-react'

interface MessageToolbarProps {
  onThinking?: () => void
  onCopy: () => void
  onExpand?: () => void
  onCollapse?: () => void
  isExpanded?: boolean
  isDarkMode?: boolean
  isCopied?: boolean
}

const MessageToolbar: React.FC<MessageToolbarProps> = ({
  onThinking,
  onCopy,
  onExpand,
  onCollapse,
  isExpanded = false,
  isDarkMode = false,
  isCopied = false
}) => {
  return (
    <div 
      className="message-toolbar"
      style={{
        display: 'flex',
        gap: '8px',
        marginTop: '8px',
        opacity: 0,
        transition: 'opacity 0.2s ease'
      }}>
      {onThinking && (
        <button
          onClick={onThinking}
          aria-label="Show thinking process"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            backgroundColor: 'transparent',
            border: `1px solid ${isDarkMode ? '#3d3d3d' : '#e0e0e0'}`,
            borderRadius: '6px',
            color: isDarkMode ? '#e0e0e0' : '#666666',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.1s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? '#2d2d2d' : '#f5f5f5'
            e.currentTarget.style.borderColor = isDarkMode ? '#4d4d4d' : '#d0d0d0'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderColor = isDarkMode ? '#3d3d3d' : '#e0e0e0'
          }}
        >
          <Lightbulb size={14} />
          <span>Thinking</span>
        </button>
      )}
      
      <button
        onClick={onCopy}
        aria-label="Copy message content"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 8px',
          backgroundColor: 'transparent',
          border: `1px solid ${isDarkMode ? '#3d3d3d' : '#e0e0e0'}`,
          borderRadius: '6px',
          color: isDarkMode ? '#e0e0e0' : '#666666',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'all 0.1s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = isDarkMode ? '#2d2d2d' : '#f5f5f5'
          e.currentTarget.style.borderColor = isDarkMode ? '#4d4d4d' : '#d0d0d0'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.borderColor = isDarkMode ? '#3d3d3d' : '#e0e0e0'
        }}
      >
        {isCopied ? <Check size={14} /> : <Copy size={14} />}
        <span>{isCopied ? 'Copied!' : 'Copy'}</span>
      </button>
      
      {(onExpand || onCollapse) && (
        <button
          onClick={isExpanded ? onCollapse : onExpand}
          aria-label={isExpanded ? 'Collapse message details' : 'Expand message details'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            backgroundColor: 'transparent',
            border: `1px solid ${isDarkMode ? '#3d3d3d' : '#e0e0e0'}`,
            borderRadius: '6px',
            color: isDarkMode ? '#e0e0e0' : '#666666',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.1s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = isDarkMode ? '#2d2d2d' : '#f5f5f5'
            e.currentTarget.style.borderColor = isDarkMode ? '#4d4d4d' : '#d0d0d0'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.borderColor = isDarkMode ? '#3d3d3d' : '#e0e0e0'
          }}
        >
          {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
        </button>
      )}
    </div>
  )
}

export default MessageToolbar
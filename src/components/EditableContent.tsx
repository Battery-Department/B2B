'use client';

import React, { useState, useEffect } from 'react';

interface EditableContentProps {
  children: React.ReactNode;
  contentKey: string;
  tag?: keyof React.JSX.IntrinsicElements;
  style?: React.CSSProperties;
  onSave?: (content: string) => void;
}

export function EditableContent({ 
  children, 
  contentKey, 
  tag = 'div',
  style,
  onSave 
}: EditableContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(children?.toString() || '');
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    // Check if we're in edit mode via URL parameter
    const checkEditMode = () => {
      const urlParams = new URLSearchParams(window.location.search);
      setIsEditMode(urlParams.get('edit') === 'true');
    };

    checkEditMode();
    window.addEventListener('popstate', checkEditMode);

    // Load saved content from localStorage
    const savedContent = localStorage.getItem(`content-${contentKey}`);
    if (savedContent) {
      setContent(savedContent);
    }

    return () => window.removeEventListener('popstate', checkEditMode);
  }, [contentKey]);

  const handleSave = () => {
    localStorage.setItem(`content-${contentKey}`, content);
    if (onSave) {
      onSave(content);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    const savedContent = localStorage.getItem(`content-${contentKey}`);
    setContent(savedContent || children?.toString() || '');
    setIsEditing(false);
  };

  // If not in edit mode, just render the content
  if (!isEditMode) {
    const Tag = tag;
    return <Tag style={style}>{content}</Tag>;
  }

  // If we're editing this specific element
  if (isEditing) {
    return (
      <div style={{ position: 'relative', ...style }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '8px',
            border: '2px solid #0066cc',
            borderRadius: '4px',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
          autoFocus
        />
        <div style={{
          marginTop: '8px',
          display: 'flex',
          gap: '8px',
        }}>
          <button
            onClick={handleSave}
            style={{
              padding: '6px 16px',
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            style={{
              padding: '6px 16px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // If in edit mode but not editing this element
  const Tag = tag;
  return (
    <Tag
      onClick={() => setIsEditing(true)}
      style={{
        ...style,
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.outline = '2px dashed #0066cc';
        (e.currentTarget as HTMLElement).style.outlineOffset = '4px';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.outline = 'none';
      }}
    >
      {content}
      <span
        style={{
          position: 'absolute',
          top: '-24px',
          left: '0',
          fontSize: '12px',
          backgroundColor: '#0066cc',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          opacity: '0',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.opacity = '1';
        }}
      >
        Click to edit
      </span>
    </Tag>
  );
}

// Export a hook to check if we're in edit mode
export function useEditMode() {
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const checkEditMode = () => {
      const urlParams = new URLSearchParams(window.location.search);
      setIsEditMode(urlParams.get('edit') === 'true');
    };

    checkEditMode();
    window.addEventListener('popstate', checkEditMode);

    return () => window.removeEventListener('popstate', checkEditMode);
  }, []);

  return isEditMode;
}
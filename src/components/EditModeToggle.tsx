'use client';

import React, { useState, useEffect } from 'react';

export function EditModeToggle() {
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setIsEditMode(urlParams.get('edit') === 'true');
  }, []);

  const toggleEditMode = () => {
    const newUrl = new URL(window.location.href);
    if (isEditMode) {
      newUrl.searchParams.delete('edit');
    } else {
      newUrl.searchParams.set('edit', 'true');
    }
    window.history.pushState({}, '', newUrl);
    window.location.reload();
  };

  return (
    <button
      onClick={toggleEditMode}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '12px 24px',
        backgroundColor: isEditMode ? '#DC2626' : '#0066CC',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        {isEditMode ? (
          <path d="M18 6L6 18M6 6l12 12" />
        ) : (
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        )}
      </svg>
      {isEditMode ? 'Exit Edit Mode' : 'Edit Page'}
    </button>
  );
}
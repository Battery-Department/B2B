'use client'

import React from 'react'
import BatteryTicker from '@/components/BatteryTicker'

export default function BatteryTickerDemo() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(to right, #006FEE, #0050B3)',
          padding: '32px',
          boxShadow: '0 2px 12px rgba(0, 111, 238, 0.15)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: '32px',
              fontWeight: '800',
              color: 'white',
              margin: 0,
            }}
          >
            Battery Ticker Animation Demo
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.9)',
              marginTop: '8px',
            }}
          >
            Watch as blank batteries transform with laser engraving
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '48px 32px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          {/* Description Card */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #E6F4FF',
              padding: '24px',
              marginBottom: '48px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '16px',
              }}
            >
              How It Works
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <div>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#006FEE',
                    marginBottom: '8px',
                  }}
                >
                  🔄 Continuous Motion
                </h3>
                <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                  Batteries move smoothly from left to right at a readable speed of 12 seconds per crossing
                </p>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#006FEE',
                    marginBottom: '8px',
                  }}
                >
                  ⚡ Laser Transformation
                </h3>
                <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                  When batteries pass through the blue laser line, they instantly receive custom engravings
                </p>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#006FEE',
                    marginBottom: '8px',
                  }}
                >
                  🎯 Professional Results
                </h3>
                <p style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
                  Each battery displays unique company names and serial numbers for theft prevention
                </p>
              </div>
            </div>
          </div>

          {/* Ticker Section */}
          <div style={{ marginBottom: '48px' }}>
            <h2
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              Live Demonstration
            </h2>
            <div
              style={{
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid #E6F4FF',
                boxShadow: '0 8px 24px rgba(0, 111, 238, 0.1)',
              }}
            >
              <BatteryTicker />
            </div>
          </div>

          {/* Features Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '2px solid #E6F4FF',
                padding: '20px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 111, 238, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⏱️</div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                12 Second Speed
              </h3>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>
                Optimized for comfortable reading of engraved text
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '2px solid #E6F4FF',
                padding: '20px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 111, 238, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔵</div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                Laser Precision
              </h3>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>
                Blue laser line with glowing effect marks the transformation point
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '2px solid #E6F4FF',
                padding: '20px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 111, 238, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>♾️</div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                Seamless Loop
              </h3>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>
                Continuous animation with no gaps or stuttering
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '2px solid #E6F4FF',
                padding: '20px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 111, 238, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>📱</div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                Responsive Design
              </h3>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>
                Adapts perfectly to all screen sizes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          backgroundColor: '#111827',
          color: 'white',
          padding: '32px',
          marginTop: '80px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '14px', opacity: 0.8 }}>
          Battery Department © 2025 - Professional Battery Engraving Solutions
        </p>
      </div>
    </div>
  )
}
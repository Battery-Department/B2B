'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface BatteryItem {
  id: number
  x: number
  isEngraved: boolean
  engravedImage?: string
}

const BatteryTicker: React.FC = () => {
  // Configuration
  const BATTERY_WIDTH = 300
  const BATTERY_GAP = 80
  const TOTAL_WIDTH = BATTERY_WIDTH + BATTERY_GAP
  const SPEED = 160 // pixels per second (viewport crossing in 12 seconds)
  const LASER_POSITION = 50 // percentage

  // Sample engraved battery images - in production these would come from your database
  const engravedBatteries = [
    '/images/batteries/engraved-1.png',
    '/images/batteries/engraved-2.png',
    '/images/batteries/engraved-3.png',
    '/images/batteries/engraved-4.png',
    '/images/batteries/engraved-5.png',
  ]

  // Using the provided battery image
  const blankBatteryImage = '/images/batteries/blank-battery.png'
  const defaultEngravedImage = '/images/batteries/blank-battery.png' // Fallback

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(1920)
  const [batteries, setBatteries] = useState<BatteryItem[]>([])
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)

  // Initialize batteries
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    updateContainerWidth()
    window.addEventListener('resize', updateContainerWidth)

    // Create initial batteries
    const batteryCount = Math.ceil((containerWidth + TOTAL_WIDTH * 2) / TOTAL_WIDTH)
    const initialBatteries: BatteryItem[] = []

    for (let i = 0; i < batteryCount; i++) {
      initialBatteries.push({
        id: i,
        x: i * TOTAL_WIDTH - TOTAL_WIDTH,
        isEngraved: false,
      })
    }

    setBatteries(initialBatteries)

    return () => {
      window.removeEventListener('resize', updateContainerWidth)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [containerWidth])

  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp
      }

      const deltaTime = (timestamp - lastTimeRef.current) / 1000 // Convert to seconds
      lastTimeRef.current = timestamp

      setBatteries(prevBatteries => {
        const laserX = containerWidth * (LASER_POSITION / 100)
        
        return prevBatteries.map(battery => {
          let newX = battery.x + SPEED * deltaTime
          let isEngraved = battery.isEngraved
          let engravedImage = battery.engravedImage

          // Check if battery center crosses laser line
          const batteryCenterX = newX + BATTERY_WIDTH / 2
          
          if (!isEngraved && batteryCenterX >= laserX && batteryCenterX <= laserX + SPEED * deltaTime * 2) {
            isEngraved = true
            engravedImage = engravedBatteries[Math.floor(Math.random() * engravedBatteries.length)]
          }

          // Reset battery to left when it exits right
          if (newX > containerWidth + BATTERY_WIDTH) {
            newX = -TOTAL_WIDTH
            isEngraved = false
            engravedImage = undefined
          }

          return {
            ...battery,
            x: newX,
            isEngraved,
            engravedImage,
          }
        })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [containerWidth, engravedBatteries])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '400px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Batteries */}
      {batteries.map(battery => (
        <div
          key={battery.id}
          style={{
            position: 'absolute',
            left: `${battery.x}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: `${BATTERY_WIDTH}px`,
            height: '280px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Blank Battery */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: battery.isEngraved ? 0 : 1,
                transition: 'opacity 0.3s ease',
              }}
            >
              <Image
                src={blankBatteryImage}
                alt="Blank FlexVolt Battery"
                width={300}
                height={280}
                style={{
                  objectFit: 'contain',
                  width: '100%',
                  height: '100%',
                }}
              />
            </div>

            {/* Engraved Battery */}
            {battery.isEngraved && (
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  opacity: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                }}
              >
                {/* Simulated engraved battery */}
                <div
                  style={{
                    position: 'relative',
                    width: '90%',
                    height: '90%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image
                    src={blankBatteryImage}
                    alt="Engraved FlexVolt Battery"
                    width={300}
                    height={280}
                    style={{
                      objectFit: 'contain',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                  {/* Engraving overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      width: '60%',
                      height: '35%',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#111827',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {['ACME CORP', 'BUILD PRO', 'TECH WORKS', 'CONSTRUCT CO', 'POWER TOOLS'][battery.id % 5]}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#6B7280',
                      }}
                    >
                      #{String(1000 + battery.id).padStart(4, '0')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Laser Line */}
      <div
        style={{
          position: 'absolute',
          left: `${LASER_POSITION}%`,
          top: '-10%',
          height: '120%',
          width: '3px',
          backgroundColor: '#0080FF',
          transform: 'translateX(-50%)',
          boxShadow: '0 0 25px rgba(0, 128, 255, 0.9), 0 0 50px rgba(0, 128, 255, 0.5)',
          zIndex: 10,
        }}
      >
        {/* Laser glow effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '20px',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(0, 128, 255, 0.3), transparent)',
          }}
        />
      </div>

      {/* Gradient overlays for smooth edges */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100px',
          height: '100%',
          background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.95), transparent)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '100px',
          height: '100%',
          background: 'linear-gradient(270deg, rgba(255, 255, 255, 0.95), transparent)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />
    </div>
  )
}

export default BatteryTicker
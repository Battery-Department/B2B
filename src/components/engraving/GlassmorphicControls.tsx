import React, { useRef, useState } from 'react'
import { useEngravingStore } from '@/lib/engraving-store'
import { motion, AnimatePresence } from 'framer-motion'

const fontOptions = [
  { value: 'helvetiker', label: 'Helvetiker', preview: 'PREVIEW' },
  { value: 'optimer', label: 'Optimer', preview: 'PREVIEW' },
  { value: 'gentilis', label: 'Gentilis', preview: 'PREVIEW' },
  { value: 'droid_sans', label: 'Droid Sans', preview: 'PREVIEW' },
  { value: 'droid_serif', label: 'Droid Serif', preview: 'PREVIEW' }
]

const textPathOptions = [
  { value: 'straight', label: 'Straight', icon: '—' },
  { value: 'curved', label: 'Curved', icon: '⌒' },
  { value: 'circular', label: 'Circular', icon: '○' },
  { value: 'wave', label: 'Wave', icon: '∼' }
]

const presetStyles = [
  { 
    value: 'professional', 
    label: 'Professional',
    settings: { textSize: 0.15, engravingDepth: 0.05, spacing: 0 }
  },
  { 
    value: 'industrial', 
    label: 'Industrial',
    settings: { textSize: 0.18, engravingDepth: 0.08, spacing: 0.02 }
  },
  { 
    value: 'elegant', 
    label: 'Elegant',
    settings: { textSize: 0.12, engravingDepth: 0.03, spacing: -0.01 }
  },
  { 
    value: 'bold', 
    label: 'Bold Impact',
    settings: { textSize: 0.22, engravingDepth: 0.1, spacing: 0.01 }
  }
]

interface TabProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}

function Tab({ active, onClick, children }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 rounded-t-xl font-medium transition-all ${
        active 
          ? 'bg-white/20 text-white backdrop-blur-xl' 
          : 'bg-white/5 text-white/70 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

function GlassPanel({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl shadow-xl ${className}`}
    >
      {children}
    </motion.div>
  )
}

export default function GlassmorphicControls() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState('text')
  const [textSpacing, setTextSpacing] = useState(0)
  const [selectedFont, setSelectedFont] = useState('helvetiker')
  const [textPath, setTextPath] = useState('straight')
  
  const {
    text,
    setText,
    primaryText,
    secondaryText,
    showSecondaryText,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    textAlign,
    setTextAlign,
    textXPosition,
    textYPosition,
    textSize,
    engravingDepth,
    showLogo,
    logoScale,
    setPrimaryText,
    setSecondaryText,
    setShowSecondaryText,
    setTextXPosition,
    setTextYPosition,
    setTextSize,
    setEngravingDepth,
    setLogoImage,
    setShowLogo,
    setLogoScale,
  } = useEngravingStore()

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoImage(reader.result as string)
        setShowLogo(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const applyPresetStyle = (preset: typeof presetStyles[0]) => {
    setTextSize(preset.settings.textSize)
    setEngravingDepth(preset.settings.engravingDepth)
    setTextSpacing(preset.settings.spacing)
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-2">
        <Tab active={activeTab === 'text'} onClick={() => setActiveTab('text')}>
          Text
        </Tab>
        <Tab active={activeTab === 'logo'} onClick={() => setActiveTab('logo')}>
          Logo
        </Tab>
        <Tab active={activeTab === 'effects'} onClick={() => setActiveTab('effects')}>
          Effects
        </Tab>
      </div>

      <AnimatePresence mode="wait">
        {/* Text Tab */}
        {activeTab === 'text' && (
          <motion.div
            key="text"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Text Content</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 font-medium mb-2">Primary Text</label>
                  <input
                    type="text"
                    value={primaryText}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase()
                      setPrimaryText(value)
                      setText(value)
                    }}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/50"
                    placeholder="Enter main text"
                    maxLength={20}
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 font-medium mb-2">Secondary Text</label>
                  <input
                    type="text"
                    value={secondaryText}
                    onChange={(e) => setSecondaryText(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/50"
                    placeholder="Enter secondary text"
                    maxLength={30}
                  />
                  <label className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      checked={showSecondaryText}
                      onChange={(e) => setShowSecondaryText(e.target.checked)}
                      className="mr-2 h-4 w-4 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-white/50"
                    />
                    <span className="text-white/80">Show secondary text</span>
                  </label>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Typography</h3>
              
              {/* Font Preview Dropdown */}
              <div className="mb-4">
                <label className="block text-white/80 font-medium mb-2">Font Style</label>
                <div className="space-y-2">
                  {fontOptions.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => setSelectedFont(font.value)}
                      className={`w-full px-4 py-3 rounded-lg flex items-center justify-between transition-all ${
                        selectedFont === font.value
                          ? 'bg-white/20 border border-white/40'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-white">{font.label}</span>
                      <span className="text-2xl text-white/70" style={{ fontFamily: font.value }}>
                        {font.preview}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Path Options */}
              <div className="mb-4">
                <label className="block text-white/80 font-medium mb-2">Text Path</label>
                <div className="grid grid-cols-2 gap-2">
                  {textPathOptions.map((path) => (
                    <button
                      key={path.value}
                      onClick={() => setTextPath(path.value)}
                      className={`px-4 py-3 rounded-lg flex flex-col items-center transition-all ${
                        textPath === path.value
                          ? 'bg-white/20 border border-white/40'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl text-white mb-1">{path.icon}</span>
                      <span className="text-sm text-white/80">{path.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Styles */}
              <div>
                <label className="block text-white/80 font-medium mb-2">Preset Styles</label>
                <div className="grid grid-cols-2 gap-2">
                  {presetStyles.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => applyPresetStyle(preset)}
                      className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-white/80 hover:text-white"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacing Control */}
              <div className="mt-4">
                <label className="block text-white/80 font-medium mb-2">
                  Letter Spacing: {textSpacing.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="-0.05"
                  max="0.1"
                  step="0.01"
                  value={textSpacing}
                  onChange={(e) => setTextSpacing(parseFloat(e.target.value))}
                  className="w-full accent-white"
                />
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {/* Logo Tab */}
        {activeTab === 'logo' && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Logo Upload</h3>
              
              <div className="space-y-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/20 rounded-lg hover:from-blue-500/30 hover:to-purple-500/30 transition-all text-white"
                >
                  Upload Logo Image
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                
                {showLogo && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/80 font-medium mb-2">
                        Logo Size: {logoScale.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0.3"
                        max="1.5"
                        step="0.1"
                        value={logoScale}
                        onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                        className="w-full accent-white"
                      />
                    </div>
                    
                    <button
                      onClick={() => setShowLogo(false)}
                      className="w-full px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all text-white"
                    >
                      Remove Logo
                    </button>
                  </div>
                )}
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {/* Effects Tab */}
        {activeTab === 'effects' && (
          <motion.div
            key="effects"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Position & Size</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 font-medium mb-2">
                    Horizontal: {textXPosition.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="-1.5"
                    max="1.5"
                    step="0.1"
                    value={textXPosition}
                    onChange={(e) => setTextXPosition(parseFloat(e.target.value))}
                    className="w-full accent-white"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 font-medium mb-2">
                    Vertical: {textYPosition.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.1"
                    value={textYPosition}
                    onChange={(e) => setTextYPosition(parseFloat(e.target.value))}
                    className="w-full accent-white"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 font-medium mb-2">
                    Text Size: {textSize.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.08"
                    max="0.25"
                    step="0.01"
                    value={textSize}
                    onChange={(e) => setTextSize(parseFloat(e.target.value))}
                    className="w-full accent-white"
                  />
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Engraving</h3>
              
              <div>
                <label className="block text-white/80 font-medium mb-2">
                  Depth: {engravingDepth.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="0.15"
                  step="0.01"
                  value={engravingDepth}
                  onChange={(e) => setEngravingDepth(parseFloat(e.target.value))}
                  className="w-full accent-white"
                />
                <p className="text-sm text-white/60 mt-2">
                  Deeper engraving creates more dramatic shadows and highlights
                </p>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
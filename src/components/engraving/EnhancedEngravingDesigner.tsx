import React, { useRef, useState, useEffect } from 'react'
import { useEngravingStore } from '@/lib/engraving-store'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Type, 
  Image, 
  Sliders, 
  Package,
  Upload,
  X,
  Check,
  Move,
  Maximize2,
  ZoomIn,
  Palette,
  Layout,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  Download,
  Info
} from 'lucide-react'

// Font options with proper preview
const fontOptions = [
  { value: 'Arial', label: 'Arial', preview: 'Professional Look' },
  { value: 'Helvetica', label: 'Helvetica', preview: 'Clean & Modern' },
  { value: 'Times New Roman', label: 'Times', preview: 'Classic Style' },
  { value: 'Courier New', label: 'Courier', preview: 'Technical Feel' },
  { value: 'Georgia', label: 'Georgia', preview: 'Elegant Touch' }
]

// Engraving templates
const engravingTemplates = [
  {
    id: 'company-basic',
    name: 'Company Basic',
    icon: <Type size={20} />,
    settings: {
      primaryText: 'COMPANY NAME',
      secondaryText: 'Est. 2024',
      showSecondaryText: true,
      textSize: 0.15,
      engravingDepth: 0.05,
      textAlign: 'center',
      fontFamily: 'Arial'
    }
  },
  {
    id: 'personal-design',
    name: 'Personal Design',
    icon: <Package size={20} />,
    settings: {
      primaryText: 'JOHN',
      secondaryText: 'SMITH',
      showSecondaryText: true,
      textSize: 0.14,
      engravingDepth: 0.04,
      textAlign: 'center',
      fontFamily: 'Helvetica'
    }
  },
  {
    id: 'worker-id',
    name: 'Worker ID',
    icon: <Image size={20} />,
    settings: {
      primaryText: 'WORKER #001',
      secondaryText: 'Department Name',
      showSecondaryText: true,
      textSize: 0.12,
      engravingDepth: 0.05,
      textAlign: 'center',
      fontFamily: 'Arial'
    }
  },
  {
    id: 'tool-id',
    name: 'Tool ID',
    icon: <Layers size={20} />,
    settings: {
      primaryText: 'TOOL #001',
      secondaryText: 'Property of ABC Corp',
      showSecondaryText: true,
      textSize: 0.12,
      engravingDepth: 0.06,
      textAlign: 'left',
      fontFamily: 'Courier New'
    }
  }
]

// Position presets
const positionPresets = [
  { name: 'Center', x: 0, y: 0, icon: <Maximize2 size={16} /> },
  { name: 'Top', x: 0, y: -0.3, icon: <Move size={16} /> },
  { name: 'Bottom', x: 0, y: 0.3, icon: <Move size={16} /> },
  { name: 'Left', x: -0.5, y: 0, icon: <Move size={16} /> },
  { name: 'Right', x: 0.5, y: 0, icon: <Move size={16} /> }
]

interface TabProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  icon: React.ReactNode
}

function Tab({ active, onClick, children, icon }: TabProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 24px',
        backgroundColor: active ? '#006FEE' : 'white',
        color: active ? 'white' : '#374151',
        border: `2px solid ${active ? '#006FEE' : '#E6F4FF'}`,
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = '#F8FAFC'
          e.currentTarget.style.borderColor = '#006FEE'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'white'
          e.currentTarget.style.borderColor = '#E6F4FF'
        }
      }}
    >
      {icon}
      {children}
    </button>
  )
}

export default function EnhancedEngravingDesigner() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState('text')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 })
  const [isLogoUploading, setIsLogoUploading] = useState(false)
  
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
    setLogoUrl,
    setShowLogo,
    setLogoScale,
    setIsAnimating,
  } = useEngravingStore()

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    })

    // Validate file type - accept common image formats
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!validImageTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type)
      alert('Please upload a valid image file (JPG, PNG, GIF, WebP, or SVG)')
      return
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.error('File too large:', file.size, 'bytes')
      alert('File size must be less than 5MB')
      return
    }

    // Validate file name
    if (file.name.length > 100) {
      console.error('File name too long:', file.name.length)
      alert('File name must be less than 100 characters')
      return
    }

    const reader = new FileReader()
    
    reader.onloadstart = () => {
      setIsLogoUploading(true)
      console.log('Starting logo file read...')
    }
    
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100
        console.log('Logo file read progress:', progress.toFixed(1) + '%')
      }
    }
    
    reader.onloadend = () => {
      const logoDataUrl = reader.result as string
      
      // Validate the result
      if (!logoDataUrl || typeof logoDataUrl !== 'string') {
        console.error('Invalid file read result:', typeof logoDataUrl)
        alert('Error processing file. Please try again.')
        return
      }

      // Check if it's a valid data URL
      if (!logoDataUrl.startsWith('data:image/')) {
        console.error('Invalid data URL format:', logoDataUrl.substring(0, 50))
        alert('Error processing image file. Please try a different file.')
        return
      }

      console.log('Logo file read complete:', {
        dataUrlLength: logoDataUrl.length,
        type: logoDataUrl.substring(0, logoDataUrl.indexOf(';')),
        preview: logoDataUrl.substring(0, 100) + '...'
      })
      
      try {
        // Update both logoImage and logoUrl for compatibility
        setLogoImage(logoDataUrl)
        setLogoUrl(logoDataUrl) 
        setShowLogo(true)
        
        console.log('Logo state updated successfully - showLogo: true')
        
        // Clear the file input to allow re-uploading the same file
        if (e.target) {
          e.target.value = ''
        }
        
        // Force a re-render by updating animation state briefly
        setIsAnimating(true)
        setTimeout(() => {
          setIsAnimating(false)
          console.log('Logo upload completed and animation triggered')
        }, 100)
        
        // Show success message briefly
        setIsLogoUploading(false)
        
      } catch (error) {
        console.error('Error updating logo state:', error)
        alert('Error updating logo. Please try again.')
      }
    }
    
    reader.onerror = (error) => {
      setIsLogoUploading(false)
      console.error('FileReader error:', error)
      alert('Error reading file. Please try again with a different image.')
    }
    
    reader.onabort = () => {
      setIsLogoUploading(false)
      console.warn('File reading was aborted')
      alert('File upload was cancelled.')
    }
    
    try {
      reader.readAsDataURL(file)
    } catch (error) {
      setIsLogoUploading(false)
      console.error('Error starting file read:', error)
      alert('Error starting file upload. Please try again.')
    }
  }

  const applyTemplate = (template: typeof engravingTemplates[0]) => {
    setSelectedTemplate(template.id)
    const settings = template.settings
    
    if ('primaryText' in settings) setPrimaryText(settings.primaryText)
    if ('secondaryText' in settings) setSecondaryText(settings.secondaryText)
    if ('showSecondaryText' in settings) setShowSecondaryText(settings.showSecondaryText)
    if ('textSize' in settings) setTextSize(settings.textSize)
    if ('engravingDepth' in settings) setEngravingDepth(settings.engravingDepth)
    if ('textAlign' in settings) setTextAlign(settings.textAlign)
    if ('fontFamily' in settings) setFontFamily(settings.fontFamily)
    if ('showLogo' in settings) setShowLogo(settings.showLogo)
    if ('logoScale' in settings) setLogoScale(settings.logoScale)
  }

  const applyPositionPreset = (preset: typeof positionPresets[0]) => {
    setTextXPosition(preset.x)
    setTextYPosition(preset.y)
    setPreviewPosition({ x: preset.x, y: preset.y })
  }

  return (
    <div style={{ maxWidth: '100%', position: 'relative' }}>
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px', 
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 20
      }}>
        <Tab 
          active={activeTab === 'text'} 
          onClick={() => setActiveTab('text')}
          icon={<Type size={18} />}
        >
          Text
        </Tab>
        <Tab 
          active={activeTab === 'typography'} 
          onClick={() => setActiveTab('typography')}
          icon={<Palette size={18} />}
        >
          Typography
        </Tab>
        <Tab 
          active={activeTab === 'logo'} 
          onClick={() => setActiveTab('logo')}
          icon={<Image size={18} />}
        >
          Logo
        </Tab>
        <Tab 
          active={activeTab === 'position'} 
          onClick={() => setActiveTab('position')}
          icon={<Move size={18} />}
        >
          Position
        </Tab>
      </div>

      {/* Tab Content Container */}
      <div style={{
        position: 'relative',
        minHeight: '400px',
        backgroundColor: 'transparent'
      }}>
        <AnimatePresence mode="wait" initial={false}>
        {/* Text Tab */}
        {activeTab === 'text' && (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
          >
            {/* Template Selection */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #E6F4FF',
              padding: '24px',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#111827', 
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Layout size={20} />
                Quick Templates
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '12px' 
              }}>
                {engravingTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    style={{
                      padding: '16px',
                      backgroundColor: selectedTemplate === template.id ? '#EFF6FF' : '#F9FAFB',
                      border: `2px solid ${selectedTemplate === template.id ? '#006FEE' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedTemplate !== template.id) {
                        e.currentTarget.style.backgroundColor = '#F3F4F6'
                        e.currentTarget.style.borderColor = '#D1D5DB'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedTemplate !== template.id) {
                        e.currentTarget.style.backgroundColor = '#F9FAFB'
                        e.currentTarget.style.borderColor = '#E5E7EB'
                      }
                    }}
                  >
                    <div style={{ color: selectedTemplate === template.id ? '#006FEE' : '#6B7280' }}>
                      {template.icon}
                    </div>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: selectedTemplate === template.id ? '#006FEE' : '#374151'
                    }}>
                      {template.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Text Input */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #E6F4FF',
              padding: '24px',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#111827', 
                marginBottom: '16px' 
              }}>
                Text Content
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: '#374151', 
                    fontWeight: '600', 
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Primary Text
                  </label>
                  <input
                    type="text"
                    value={primaryText}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase()
                      setPrimaryText(value)
                      setText(value)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      backgroundColor: '#F9FAFB',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#111827',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#006FEE'
                      e.target.style.backgroundColor = 'white'
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 111, 238, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#E5E7EB'
                      e.target.style.backgroundColor = '#F9FAFB'
                      e.target.style.boxShadow = 'none'
                    }}
                    placeholder="Enter main text"
                    maxLength={20}
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: '#374151', 
                    fontWeight: '600', 
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Secondary Text
                  </label>
                  <input
                    type="text"
                    value={secondaryText}
                    onChange={(e) => setSecondaryText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      backgroundColor: '#F9FAFB',
                      border: '2px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#111827',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#006FEE'
                      e.target.style.backgroundColor = 'white'
                      e.target.style.boxShadow = '0 0 0 3px rgba(0, 111, 238, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#E5E7EB'
                      e.target.style.backgroundColor = '#F9FAFB'
                      e.target.style.boxShadow = 'none'
                    }}
                    placeholder="Enter secondary text"
                    maxLength={30}
                  />
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginTop: '12px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={showSecondaryText}
                      onChange={(e) => setShowSecondaryText(e.target.checked)}
                      style={{ 
                        marginRight: '8px', 
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ color: '#6B7280', fontSize: '14px' }}>
                      Show secondary text
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <motion.div
            key="typography"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
          >
            {/* Font Selection */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #E6F4FF',
              padding: '24px',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#111827', 
                marginBottom: '16px' 
              }}>
                Font Style
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: '#374151', 
                    fontWeight: '600', 
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    Select Font
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {fontOptions.map((font) => (
                      <button
                        key={font.value}
                        onClick={() => setFontFamily(font.value)}
                        style={{
                          width: '100%',
                          padding: '12px 20px',
                          backgroundColor: fontFamily === font.value ? '#EFF6FF' : 'white',
                          border: `2px solid ${fontFamily === font.value ? '#006FEE' : '#E5E7EB'}`,
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (fontFamily !== font.value) {
                            e.currentTarget.style.backgroundColor = '#F9FAFB'
                            e.currentTarget.style.borderColor = '#D1D5DB'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (fontFamily !== font.value) {
                            e.currentTarget.style.backgroundColor = 'white'
                            e.currentTarget.style.borderColor = '#E5E7EB'
                          }
                        }}
                      >
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: '600',
                          color: fontFamily === font.value ? '#006FEE' : '#374151'
                        }}>
                          {font.label}
                        </span>
                        <span style={{ 
                          fontSize: '16px', 
                          fontFamily: font.value,
                          color: '#6B7280'
                        }}>
                          {font.preview}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Text Alignment */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #E6F4FF',
              padding: '24px',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#111827', 
                marginBottom: '16px' 
              }}>
                Text Alignment
              </h3>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  color: '#374151', 
                  fontWeight: '600', 
                  marginBottom: '8px',
                  fontSize: '14px'
                }}>
                  Alignment Options
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['left', 'center', 'right'].map((align) => (
                    <button
                      key={align}
                      onClick={() => setTextAlign(align)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        backgroundColor: textAlign === align ? '#006FEE' : 'white',
                        border: `2px solid ${textAlign === align ? '#006FEE' : '#E5E7EB'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => {
                        if (textAlign !== align) {
                          e.currentTarget.style.backgroundColor = '#F9FAFB'
                          e.currentTarget.style.borderColor = '#D1D5DB'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (textAlign !== align) {
                          e.currentTarget.style.backgroundColor = 'white'
                          e.currentTarget.style.borderColor = '#E5E7EB'
                        }
                      }}
                    >
                      {align === 'left' && <AlignLeft size={18} color={textAlign === align ? 'white' : '#6B7280'} />}
                      {align === 'center' && <AlignCenter size={18} color={textAlign === align ? 'white' : '#6B7280'} />}
                      {align === 'right' && <AlignRight size={18} color={textAlign === align ? 'white' : '#6B7280'} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Logo Tab - ONLY shows file upload, NO text input */}
        {activeTab === 'logo' && (
          <motion.div
            key="logo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ 
              position: 'relative',
              zIndex: 10,
              backgroundColor: '#F9FAFB',
              borderRadius: '12px',
              padding: '4px'
            }}
          >
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #E6F4FF',
              padding: '24px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#111827', 
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Image size={20} color="#006FEE" />
                Logo Upload Only
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: '#6B7280', 
                marginBottom: '16px',
                fontWeight: '500'
              }}>
                Upload your logo image file. Text inputs are disabled in logo mode.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button
                  onClick={() => !isLogoUploading && fileInputRef.current?.click()}
                  disabled={isLogoUploading}
                  style={{
                    padding: '20px',
                    backgroundColor: isLogoUploading ? '#F3F4F6' : '#EFF6FF',
                    border: `2px dashed ${isLogoUploading ? '#9CA3AF' : '#006FEE'}`,
                    borderRadius: '8px',
                    cursor: isLogoUploading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isLogoUploading ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLogoUploading) {
                      e.currentTarget.style.backgroundColor = '#DBEAFE'
                      e.currentTarget.style.borderColor = '#0050B3'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLogoUploading) {
                      e.currentTarget.style.backgroundColor = '#EFF6FF'
                      e.currentTarget.style.borderColor = '#006FEE'
                    }
                  }}
                >
                  {isLogoUploading ? (
                    <div style={{
                      width: '24px',
                      height: '24px',
                      border: '2px solid #E5E7EB',
                      borderTopColor: '#006FEE',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  ) : (
                    <Upload size={24} color="#006FEE" />
                  )}
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: isLogoUploading ? '#6B7280' : '#006FEE' 
                  }}>
                    {isLogoUploading ? 'Uploading...' : 'Upload Logo Image'}
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#6B7280' 
                  }}>
                    PNG, JPG, SVG up to 5MB
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                />
                
                {showLogo && (
                  <>
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '12px'
                      }}>
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: '#374151' 
                        }}>
                          Logo uploaded successfully
                        </span>
                        <Check size={18} color="#10B981" />
                      </div>
                      
                      <div>
                        <label style={{ 
                          display: 'block', 
                          color: '#374151', 
                          fontWeight: '600', 
                          marginBottom: '8px',
                          fontSize: '14px'
                        }}>
                          Logo Size: {logoScale.toFixed(1)}x
                        </label>
                        <input
                          type="range"
                          min="0.3"
                          max="1.5"
                          step="0.1"
                          value={logoScale}
                          onChange={(e) => setLogoScale(parseFloat(e.target.value))}
                          style={{
                            width: '100%',
                            height: '6px',
                            borderRadius: '3px',
                            background: '#E5E7EB',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        />
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          marginTop: '4px'
                        }}>
                          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Small</span>
                          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Large</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        console.log('Removing logo...')
                        setShowLogo(false)
                        setLogoImage(null)
                        setLogoUrl(null)
                        // Clear the file input
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                        console.log('Logo removed successfully')
                      }}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: 'white',
                        border: '2px solid #FEE2E2',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FEE2E2'
                        e.currentTarget.style.borderColor = '#EF4444'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.borderColor = '#FEE2E2'
                      }}
                    >
                      <X size={18} color="#EF4444" />
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#EF4444' }}>
                        Remove Logo
                      </span>
                    </button>
                  </>
                )}

                {/* Helpful note for logo mode */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#EEF2FF',
                  border: '2px solid #C7D2FE',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <Info size={18} color="#3730A3" />
                  <div>
                    <div style={{ fontSize: '14px', color: '#3730A3', fontWeight: '600', marginBottom: '4px' }}>
                      Logo Mode Active
                    </div>
                    <span style={{ fontSize: '13px', color: '#4338CA', lineHeight: '1.4' }}>
                      Your logo will be centered on the battery nameplate. Text inputs are disabled in logo mode.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Position Tab */}
        {activeTab === 'position' && (
          <motion.div
            key="position"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
          >
            {/* Text Appearance */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #E6F4FF',
              padding: '24px',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#111827', 
                marginBottom: '16px' 
              }}>
                Text Appearance
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#374151', 
                    fontWeight: '600', 
                    marginBottom: '12px',
                    fontSize: '14px'
                  }}>
                    <span>Text Size</span>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#EFF6FF',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#006FEE',
                      fontWeight: '600'
                    }}>
                      {textSize.toFixed(2)}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0.08"
                    max="0.25"
                    step="0.01"
                    value={textSize}
                    onChange={(e) => setTextSize(parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: '#E5E7EB',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginTop: '4px'
                  }}>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Small</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Large</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Engraving Settings */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #E6F4FF',
              padding: '24px',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#111827', 
                marginBottom: '16px' 
              }}>
                Engraving Settings
              </h3>
              
              <div>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#374151', 
                  fontWeight: '600', 
                  marginBottom: '12px',
                  fontSize: '14px'
                }}>
                  <span>Engraving Depth</span>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: '#EFF6FF',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#006FEE',
                    fontWeight: '600'
                  }}>
                    {engravingDepth.toFixed(2)}mm
                  </span>
                </label>
                <input
                  type="range"
                  min="0.01"
                  max="0.15"
                  step="0.01"
                  value={engravingDepth}
                  onChange={(e) => setEngravingDepth(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: '#E5E7EB',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginTop: '4px'
                }}>
                  <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Shallow</span>
                  <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Deep</span>
                </div>
                <p style={{
                  fontSize: '13px',
                  color: '#6B7280',
                  marginTop: '8px',
                  lineHeight: '1.5'
                }}>
                  Deeper engraving creates more dramatic shadows and improves visibility
                </p>
              </div>
            </div>

            {/* Position Presets */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #E6F4FF',
              padding: '24px',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#111827', 
                marginBottom: '16px' 
              }}>
                Quick Position
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                gap: '8px' 
              }}>
                {positionPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPositionPreset(preset)}
                    style={{
                      padding: '12px',
                      backgroundColor: 
                        textXPosition === preset.x && textYPosition === preset.y 
                          ? '#EFF6FF' 
                          : 'white',
                      border: `2px solid ${
                        textXPosition === preset.x && textYPosition === preset.y 
                          ? '#006FEE' 
                          : '#E5E7EB'
                      }`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    onMouseEnter={(e) => {
                      if (!(textXPosition === preset.x && textYPosition === preset.y)) {
                        e.currentTarget.style.backgroundColor = '#F9FAFB'
                        e.currentTarget.style.borderColor = '#D1D5DB'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!(textXPosition === preset.x && textYPosition === preset.y)) {
                        e.currentTarget.style.backgroundColor = 'white'
                        e.currentTarget.style.borderColor = '#E5E7EB'
                      }
                    }}
                  >
                    <div style={{ 
                      color: textXPosition === preset.x && textYPosition === preset.y 
                        ? '#006FEE' 
                        : '#6B7280' 
                    }}>
                      {preset.icon}
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: textXPosition === preset.x && textYPosition === preset.y 
                        ? '#006FEE' 
                        : '#374151'
                    }}>
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fine Position Control */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #E6F4FF',
              padding: '24px',
              transition: 'all 0.3s ease'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#111827', 
                marginBottom: '16px' 
              }}>
                Fine Position Control
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#374151', 
                    fontWeight: '600', 
                    marginBottom: '12px',
                    fontSize: '14px'
                  }}>
                    <span>Horizontal Position</span>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#EFF6FF',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#006FEE',
                      fontWeight: '600'
                    }}>
                      {textXPosition.toFixed(1)}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="-1.5"
                    max="1.5"
                    step="0.1"
                    value={textXPosition}
                    onChange={(e) => setTextXPosition(parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: '#E5E7EB',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginTop: '4px'
                  }}>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Left</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Center</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Right</span>
                  </div>
                </div>
                
                <div>
                  <label style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#374151', 
                    fontWeight: '600', 
                    marginBottom: '12px',
                    fontSize: '14px'
                  }}>
                    <span>Vertical Position</span>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#EFF6FF',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#006FEE',
                      fontWeight: '600'
                    }}>
                      {textYPosition.toFixed(1)}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="-0.5"
                    max="0.5"
                    step="0.1"
                    value={textYPosition}
                    onChange={(e) => setTextYPosition(parseFloat(e.target.value))}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: '#E5E7EB',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginTop: '4px'
                  }}>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Top</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Center</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Bottom</span>
                  </div>
                </div>
              </div>

              {/* Visual Position Guide */}
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                border: '1px solid #E5E7EB'
              }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '120px',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  border: '2px solid #E5E7EB',
                  overflow: 'hidden'
                }}>
                  {/* Grid lines */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '1px',
                    backgroundColor: '#E5E7EB'
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: '50%',
                    width: '1px',
                    backgroundColor: '#E5E7EB'
                  }} />
                  
                  {/* Position indicator */}
                  <div style={{
                    position: 'absolute',
                    top: `${50 - (textYPosition * 40)}%`,
                    left: `${50 + (textXPosition * 30)}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '40px',
                    height: '20px',
                    backgroundColor: '#006FEE',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 4px rgba(0, 111, 238, 0.3)'
                  }}>
                    <Type size={14} color="white" />
                  </div>
                </div>
                
                <p style={{
                  fontSize: '12px',
                  color: '#6B7280',
                  marginTop: '8px',
                  textAlign: 'center'
                }}>
                  Visual representation of text position on battery
                </p>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

    </div>
  )
}

// Add CSS for spin animation
const styles = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  document.head.appendChild(styleElement)
}
import { create } from 'zustand'

interface EngravingState {
  // Text content
  text: string
  primaryText: string
  secondaryText: string
  showSecondaryText: boolean
  line1: string
  line2: string
  
  // Typography
  fontSize: number
  fontFamily: string
  textAlign: string
  
  // Logo
  logoImage: string | null
  logoUrl: string | null
  showLogo: boolean
  logoScale: number
  
  // Text positioning
  textXPosition: number
  textYPosition: number
  textSize: number
  
  // Engraving properties
  engravingDepth: number
  isAnimating: boolean
  exportQuality: 'preview' | 'high'
  
  // Order properties
  quantity: number
  
  // Preview image for cart/checkout
  previewImage: string | null
  
  // Setters
  setText: (text: string) => void
  setPrimaryText: (text: string) => void
  setSecondaryText: (text: string) => void
  setShowSecondaryText: (show: boolean) => void
  setLine1: (text: string) => void
  setLine2: (text: string) => void
  setFontSize: (size: number) => void
  setFontFamily: (family: string) => void
  setTextAlign: (align: string) => void
  setLogoImage: (image: string | null) => void
  setLogoUrl: (url: string | null) => void
  setShowLogo: (show: boolean) => void
  setLogoScale: (scale: number) => void
  setTextXPosition: (x: number) => void
  setTextYPosition: (y: number) => void
  setTextSize: (size: number) => void
  setEngravingDepth: (depth: number) => void
  setIsAnimating: (animating: boolean) => void
  setExportQuality: (quality: 'preview' | 'high') => void
  setQuantity: (quantity: number) => void
  setPreviewImage: (image: string | null) => void
  capturePreviewImage: (canvas: HTMLCanvasElement) => void
  loadPreviewFromStorage: () => void
}

export const useEngravingStore = create<EngravingState>((set) => ({
  // Text content
  text: 'YOUR COMPANY',
  primaryText: 'CUSTOM TEXT',
  secondaryText: 'Your Name Here',
  showSecondaryText: true,
  line1: '',
  line2: '',
  
  // Typography
  fontSize: 24,
  fontFamily: 'Arial',
  textAlign: 'center',
  
  // Logo
  logoImage: null,
  logoUrl: null,
  showLogo: false,
  logoScale: 0.8,
  
  // Text positioning - centered on battery metal plate
  textXPosition: 0,
  textYPosition: 0,
  textSize: 0.15,
  
  // Engraving properties
  engravingDepth: 0.05,
  isAnimating: false,
  exportQuality: 'preview',
  
  // Order properties
  quantity: 1,
  
  // Preview image for cart/checkout
  previewImage: null,
  
  // Setters
  setText: (text) => set({ text: text }),
  setPrimaryText: (text) => set({ primaryText: text }),
  setSecondaryText: (text) => set({ secondaryText: text }),
  setShowSecondaryText: (show) => set({ showSecondaryText: show }),
  setLine1: (text) => set({ line1: text }),
  setLine2: (text) => set({ line2: text }),
  setFontSize: (size) => set({ fontSize: size }),
  setFontFamily: (family) => set({ fontFamily: family }),
  setTextAlign: (align) => set({ textAlign: align }),
  setLogoImage: (image) => set({ logoImage: image }),
  setLogoUrl: (url) => set({ logoUrl: url }),
  setShowLogo: (show) => set({ showLogo: show }),
  setLogoScale: (scale) => set({ logoScale: scale }),
  setTextXPosition: (x) => set({ textXPosition: x }),
  setTextYPosition: (y) => set({ textYPosition: y }),
  setTextSize: (size) => set({ textSize: size }),
  setEngravingDepth: (depth) => set({ engravingDepth: depth }),
  setIsAnimating: (animating) => set({ isAnimating: animating }),
  setExportQuality: (quality) => set({ exportQuality: quality }),
  setQuantity: (quantity) => set({ quantity: quantity }),
  setPreviewImage: (image) => set({ previewImage: image }),
  loadPreviewFromStorage: () => {
    try {
      const savedPreview = localStorage.getItem('lastBatteryPreview')
      if (savedPreview) {
        set({ previewImage: savedPreview })
      }
    } catch (error) {
      console.warn('Could not load preview from localStorage:', error)
    }
  },
  capturePreviewImage: (canvas) => {
    if (canvas) {
      try {
        // Ensure canvas has content before capturing
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        // Check if canvas has been drawn on (not empty)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const hasContent = imageData.data.some((pixel, index) => {
          // Check alpha channel (every 4th value) to see if any pixels are visible
          return index % 4 === 3 && pixel > 0
        })
        
        if (hasContent) {
          const dataURL = canvas.toDataURL('image/png', 0.9) // Higher quality
          set({ previewImage: dataURL })
          
          // Also store in localStorage for persistence
          try {
            localStorage.setItem('lastBatteryPreview', dataURL)
          } catch (storageError) {
            console.warn('Could not save preview to localStorage:', storageError)
          }
        }
      } catch (error) {
        console.error('Failed to capture preview image:', error)
      }
    }
  },
}))
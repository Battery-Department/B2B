import React, { useState } from 'react'
import { useEngravingStore } from '@/lib/engraving-store'

export default function ExportButton({ canvasRef }: { canvasRef: React.RefObject<HTMLCanvasElement> }) {
  const [isExporting, setIsExporting] = useState(false)
  const { exportQuality, setExportQuality } = useEngravingStore()

  const handleExport = async () => {
    if (!canvasRef.current) return

    setIsExporting(true)
    try {
      // For high quality, we'll trigger a re-render at higher resolution
      if (exportQuality === 'high') {
        // Signal the 3D scene to render at high quality
        const event = new CustomEvent('export-high-quality')
        window.dispatchEvent(event)
        
        // Wait for high-quality render
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Get the canvas data
      const dataURL = canvasRef.current.toDataURL('image/png', 1.0)
      
      // Download the image
      const link = document.createElement('a')
      link.download = `engraving-${Date.now()}.png`
      link.href = dataURL
      link.click()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
      // Reset quality
      if (exportQuality === 'high') {
        const event = new CustomEvent('export-complete')
        window.dispatchEvent(event)
      }
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Export</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-2">Export Quality</label>
          <select
            value={exportQuality}
            onChange={(e) => setExportQuality(e.target.value as 'preview' | 'high')}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="preview">Preview Quality (Fast)</option>
            <option value="high">High Quality (4K)</option>
          </select>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? 'Exporting...' : 'Download Image'}
        </button>

        <p className="text-xs text-gray-400">
          {exportQuality === 'preview' 
            ? 'Quick export at screen resolution'
            : 'High-resolution export at 4K quality with enhanced lighting and shadows'
          }
        </p>
      </div>
    </div>
  )
}
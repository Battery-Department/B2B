import React, { useState, useEffect } from 'react'
import { useServiceWorker, useOfflineQueue } from '../../utils/serviceWorker'

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom'
  showUpdatePrompt?: boolean
  className?: string
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  position = 'top',
  showUpdatePrompt = true,
  className = ''
}) => {
  const { isOnline, updateAvailable, updateServiceWorker } = useServiceWorker()
  const { queueSize, isSyncing } = useOfflineQueue()
  const [isVisible, setIsVisible] = useState(false)
  const [showQueue, setShowQueue] = useState(false)

  useEffect(() => {
    setIsVisible(!isOnline || updateAvailable || queueSize > 0)
  }, [isOnline, updateAvailable, queueSize])

  const handleUpdate = () => {
    updateServiceWorker()
  }

  const positionClass = position === 'top' ? 'top-0' : 'bottom-0'
  const statusColor = !isOnline ? 'bg-red-500' : updateAvailable ? 'bg-yellow-500' : 'bg-blue-500'

  if (!isVisible) return null

  return (
    <div className={`fixed left-0 right-0 ${positionClass} z-50 ${className}`}>
      <div className={`${statusColor} text-white px-4 py-2 text-center text-sm shadow-md`}>
        <div className="flex items-center justify-center space-x-4">
          {!isOnline && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>You're offline</span>
              {queueSize > 0 && (
                <button
                  onClick={() => setShowQueue(!showQueue)}
                  className="underline hover:no-underline"
                >
                  {queueSize} request{queueSize > 1 ? 's' : ''} queued
                </button>
              )}
              {isSyncing && (
                <span className="flex items-center space-x-1">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Syncing...</span>
                </span>
              )}
            </div>
          )}
          
          {updateAvailable && showUpdatePrompt && (
            <div className="flex items-center space-x-2">
              <span>New version available</span>
              <button
                onClick={handleUpdate}
                className="bg-white text-yellow-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
              >
                Update
              </button>
            </div>
          )}
        </div>
        
        {showQueue && queueSize > 0 && (
          <div className="mt-2 text-xs opacity-90">
            Your changes will sync automatically when you're back online
          </div>
        )}
      </div>
    </div>
  )
}

interface NetworkStatusProps {
  showDetails?: boolean
  className?: string
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  showDetails = false,
  className = ''
}) => {
  const { isOnline } = useServiceWorker()
  const [connectionType, setConnectionType] = useState<string>('unknown')
  const [effectiveType, setEffectiveType] = useState<string>('unknown')

  useEffect(() => {
    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      
      if (connection) {
        setConnectionType(connection.type || 'unknown')
        setEffectiveType(connection.effectiveType || 'unknown')
      }
    }

    updateConnectionInfo()

    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo)
      return () => connection.removeEventListener('change', updateConnectionInfo)
    }
  }, [])

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500'
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'text-yellow-500'
    return 'text-green-500'
  }

  const getStatusIcon = () => {
    if (!isOnline) return '🔴'
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return '🟡'
    return '🟢'
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className={getStatusColor()}>{getStatusIcon()}</span>
      <span className={`text-sm ${getStatusColor()}`}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
      
      {showDetails && isOnline && (
        <span className="text-xs text-gray-500">
          {effectiveType.toUpperCase()}
        </span>
      )}
    </div>
  )
}

interface OfflineQueueStatusProps {
  className?: string
}

export const OfflineQueueStatus: React.FC<OfflineQueueStatusProps> = ({
  className = ''
}) => {
  const { queueSize, isSyncing } = useOfflineQueue()
  const { isOnline } = useServiceWorker()

  if (queueSize === 0 && !isSyncing) return null

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-2">
        {isSyncing ? (
          <>
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-blue-700">Syncing changes...</span>
          </>
        ) : (
          <>
            <div className="w-4 h-4 bg-blue-500 rounded-full" />
            <span className="text-sm text-blue-700">
              {queueSize} change{queueSize > 1 ? 's' : ''} queued
            </span>
            {!isOnline && (
              <span className="text-xs text-blue-600">
                Will sync when online
              </span>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default OfflineIndicator
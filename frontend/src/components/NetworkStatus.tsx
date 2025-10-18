import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

interface NetworkStatusProps {
  className?: string
  showOnlineStatus?: boolean
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  className = '',
  showOnlineStatus = false
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (showOnlineStatus) {
        setShowStatus(true)
        setTimeout(() => setShowStatus(false), 3000) // Hide after 3 seconds
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Show offline status immediately if offline
    if (!navigator.onLine) {
      setShowStatus(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [showOnlineStatus])

  if (!showStatus) return null

  return (
    <div className={`${isOnline ? 'online-indicator' : 'offline-indicator'} ${className}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
        <span>
          {isOnline ? 'Back Online - Cornell Legal Data Synced' : 'Offline - Using Cached Cornell Legal Data'}
        </span>
      </div>
    </div>
  )
}

export default NetworkStatus
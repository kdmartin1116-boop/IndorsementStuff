import React, { useState, useEffect } from 'react'
import { Download, Smartphone, Monitor, X } from 'lucide-react'

interface PWAInstallProps {
  className?: string
  showOnDesktop?: boolean
  showOnMobile?: boolean
  variant?: 'button' | 'banner' | 'minimal'
}

const PWAInstall: React.FC<PWAInstallProps> = ({ 
  className = '',
  showOnDesktop = true,
  showOnMobile = true,
  variant = 'button'
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if PWA is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInWebAppiOS = (window.navigator as any).standalone === true
    setIsInstalled(isStandalone || isInWebAppiOS)

    // Check if device is mobile
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
    }
    checkMobile()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
      
      // Show banner automatically for first-time visitors
      const hasSeenBanner = localStorage.getItem('pwa-banner-seen')
      if (!hasSeenBanner && variant === 'banner') {
        setShowBanner(true)
      }
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      setShowBanner(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [variant])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      // Show the install prompt
      deferredPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA installation accepted')
      } else {
        console.log('PWA installation dismissed')
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null)
      setIsInstallable(false)
      
    } catch (error) {
      console.error('Error during PWA installation:', error)
    }
  }

  const handleDismissBanner = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-banner-seen', 'true')
  }

  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable) return null

  // Don't show on mobile if disabled
  if (isMobile && !showOnMobile) return null

  // Don't show on desktop if disabled
  if (!isMobile && !showOnDesktop) return null

  if (variant === 'banner' && showBanner) {
    return (
      <div className={`fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg z-50 ${className}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isMobile ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            <div>
              <h3 className="font-semibold text-sm">Install Cornell Legal Assistant</h3>
              <p className="text-xs opacity-90">
                Get instant access to legal tools and Cornell Law resources offline
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInstall}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismissBanner}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleInstall}
        className={`inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors ${className}`}
      >
        <Download className="w-4 h-4 mr-1" />
        Install App
      </button>
    )
  }

  // Default button variant
  return (
    <button
      onClick={handleInstall}
      className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium ${className}`}
    >
      <Download className="w-4 h-4 mr-2" />
      {isMobile ? 'Add to Home Screen' : 'Install App'}
    </button>
  )
}

export default PWAInstall
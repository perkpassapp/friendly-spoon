'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function SiteLaunchBanner() {
  const pathname = usePathname()
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    let mount: HTMLDivElement | null = null
    const observer = new MutationObserver(() => attachBelowNavigation())

    function attachBelowNavigation() {
      const navigation = document.querySelector('nav')
      if (!navigation || mount?.isConnected) return

      mount = document.createElement('div')
      mount.dataset.siteLaunchBanner = 'true'
      navigation.insertAdjacentElement('afterend', mount)
      setPortalRoot(mount)
      observer.disconnect()
    }

    attachBelowNavigation()
    if (!mount) {
      observer.observe(document.body, { childList: true, subtree: true })
    }

    return () => {
      observer.disconnect()
      mount?.remove()
    }
  }, [pathname])

  if (!portalRoot) return null

  return createPortal(
    <div className="site-launch-banner" role="status" aria-label="PerkPass iOS app launch announcement">
      <div className="site-launch-banner-inner">
        <span className="site-launch-banner-spark" aria-hidden="true">✦</span>
        <span className="site-launch-banner-badge">Coming soon to iPhone</span>
        <span className="site-launch-banner-copy">Philly perks are about to live in your pocket.</span>
        <Link href="/signup" className="site-launch-banner-link">Join before launch →</Link>
        <span className="site-launch-banner-spark" aria-hidden="true">✦</span>
      </div>
    </div>,
    portalRoot,
  )
}

'use client';

import { useState, useEffect } from 'react';

const IOS_DISMISSED_KEY = 'pwa-ios-dismissed';

export function usePWAInstall() {
  const [promptEvent, setPromptEvent] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const isFirefox = /firefox/i.test(ua);
    const isSafariMac = /^((?!chrome|android).)*safari/i.test(ua) && !ios;

    setIsIOS(ios);

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // iOS Safari: show sheet unless already dismissed
    if (ios && !isStandalone) {
      const dismissed = localStorage.getItem(IOS_DISMISSED_KEY) === 'true';
      if (!dismissed) {
        setShowIOSSheet(true);
      }
    }

    // Firefox / Safari macOS: hide everything
    if (isFirefox || isSafariMac) return;

    // Chrome / Android: intercept beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setPromptEvent(null);
  };

  const dismissIOSSheet = () => {
    localStorage.setItem(IOS_DISMISSED_KEY, 'true');
    setShowIOSSheet(false);
  };

  const canInstall = mounted && !!promptEvent && !isInstalled;

  return { canInstall, isInstalled, isIOS, showIOSSheet, install, dismissIOSSheet };
}

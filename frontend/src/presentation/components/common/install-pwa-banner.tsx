'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export function InstallPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    if (localStorage.getItem('pwa-dismissed') === 'true') return;
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('pwa-dismissed', 'true');
  };

  if (!showBanner || dismissed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl p-4 shadow-2xl shadow-purple-500/30 text-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Instalar POS Shop</p>
            <p className="text-xs text-white/80 mt-0.5">Accede mas rapido desde tu pantalla de inicio</p>
          </div>
          <button onClick={handleDismiss} className="p-1 hover:bg-white/20 rounded-lg shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
        <button onClick={handleInstall}
          className="w-full mt-3 h-10 bg-white text-purple-700 font-semibold text-sm rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all">
          Instalar App
        </button>
      </div>
    </div>
  );
}

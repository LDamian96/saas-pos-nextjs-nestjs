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
      <div className="bg-brand text-brand-foreground rounded-md p-4 shadow-3 border border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-brand-foreground/10 rounded-sm flex items-center justify-center shrink-0">
            <Download className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="flex-1 leading-tight">
            <p className="font-display font-semibold text-body-m">Instalar POS Shop</p>
            <p className="text-body-s text-brand-foreground/70 mt-0.5">Accede más rápido desde tu inicio.</p>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Descartar"
            className="p-1.5 -mt-1 -mr-1 hover:bg-brand-foreground/10 rounded-xs transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={handleInstall}
          className="w-full mt-3 h-10 bg-accent text-accent-foreground font-medium text-body-s rounded-sm hover:bg-accent-hover active:scale-[0.985] transition-[background,transform] duration-150"
        >
          Instalar
        </button>
      </div>
    </div>
  );
}

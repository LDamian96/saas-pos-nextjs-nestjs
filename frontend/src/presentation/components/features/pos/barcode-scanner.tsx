'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, Keyboard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [manualCode, setManualCode] = useState('');
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {}
      try {
        await scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (!containerRef.current || scannerRef.current) return;

    try {
      setError('');

      // First request camera permission explicitly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        stream.getTracks().forEach(t => t.stop()); // Release immediately
      } catch (permErr: any) {
        setError('Permite el acceso a la camara para escanear');
        setMode('manual');
        return;
      }

      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('barcode-scanner-container');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 280, height: 140 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        () => {}
      );

      // Post-start: try to improve quality
      setTimeout(async () => {
        try {
          const video = document.querySelector('#barcode-scanner-container video') as HTMLVideoElement;
          if (video?.srcObject) {
            const track = (video.srcObject as MediaStream).getVideoTracks()[0];
            const caps = track.getCapabilities() as any;
            const adv: any = {};
            if (caps.focusMode?.includes('continuous')) adv.focusMode = 'continuous';
            if (caps.zoom) adv.zoom = Math.min(caps.zoom.max, 2.0);
            if (Object.keys(adv).length > 0) {
              await track.applyConstraints({ advanced: [adv] });
            }
          }
        } catch {}
      }, 1000);

      setScanning(true);
    } catch (err: any) {
      console.error('Scanner error:', err);
      setError('No se pudo acceder a la camara');
      setMode('manual');
    }
  }, [onScan, onClose, stopScanner]);

  useEffect(() => {
    if (open && mode === 'camera') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(startScanner, 300);
      return () => clearTimeout(timer);
    }
    return () => { stopScanner(); };
  }, [open, mode, startScanner, stopScanner]);

  useEffect(() => {
    if (!open) {
      stopScanner();
      setManualCode('');
      setError('');
    }
  }, [open, stopScanner]);

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { stopScanner(); onClose(); } }}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0 max-h-[85vh]">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center justify-between text-base">
            <span>Escanear Codigo</span>
            <div className="flex gap-1.5">
              <Button
                variant={mode === 'camera' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setMode('camera'); }}
                className="text-xs h-8"
              >
                <Camera className="w-3.5 h-3.5 mr-1" />
                Camara
              </Button>
              <Button
                variant={mode === 'manual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => { stopScanner(); setMode('manual'); }}
                className="text-xs h-8"
              >
                <Keyboard className="w-3.5 h-3.5 mr-1" />
                Manual
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {mode === 'camera' ? (
          <div className="relative bg-black">
            <div
              id="barcode-scanner-container"
              ref={containerRef}
              className="w-full min-h-[300px]"
            />

            {!scanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <div className="text-center text-white">
                  <div className="w-10 h-10 border-2 border-white/60 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm">Activando camara...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                <div className="text-center text-white p-6">
                  <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm mb-1">{error}</p>
                  <p className="text-xs text-gray-400 mb-4">Verifica los permisos de camara</p>
                  <Button size="sm" onClick={() => { stopScanner(); setMode('manual'); }}>
                    Ingresar manualmente
                  </Button>
                </div>
              </div>
            )}

            {scanning && (
              <div className="px-4 py-3 bg-black/80 text-center">
                <p className="text-white text-xs">Apunta al codigo de barras del producto</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Escribe o escanea con lector USB el codigo de barras
            </p>
            <div className="flex gap-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ej: 7750000001234"
                className="font-mono text-lg"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <Button onClick={handleManualSubmit} disabled={!manualCode.trim()}>
                Buscar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

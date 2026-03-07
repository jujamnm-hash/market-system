import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export default function BarcodeScanner({ isOpen, onClose, onScan, title = 'سكان الباركود' }: Props) {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const divId = 'barcode-reader';

  const startScanner = async () => {
    setError('');
    try {
      const scanner = new Html5Qrcode(divId);
      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        setError('لا توجد كاميرا متاحة');
        return;
      }

      // prefer back camera on mobile
      const cam = cameras.find(c => /back|rear|environment/i.test(c.label)) ?? cameras[cameras.length - 1];

      await scanner.start(
        cam.id,
        { fps: 15, qrbox: { width: 250, height: 120 }, aspectRatio: 1.5 },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
          onClose();
        },
        () => {}
      );
      setScanning(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('Permission')) {
        setError('يرجى السماح للمتصفح بالوصول إلى الكاميرا');
      } else {
        setError('تعذر فتح الكاميرا: ' + msg);
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => startScanner(), 300);
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
  }, [isOpen]);

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60">
        <button onClick={handleClose} className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition">
          <X size={20} />
        </button>
        <div className="flex items-center gap-2 text-white font-semibold">
          <Camera size={18} />
          <span>{title}</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Scanner area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {error ? (
          <div className="bg-red-900/80 text-red-200 rounded-2xl p-6 text-center max-w-sm">
            <p className="text-4xl mb-3">📷</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => { setError(''); startScanner(); }}
              className="mt-4 bg-white text-red-700 px-6 py-2 rounded-xl text-sm font-semibold"
            >
              حاول مرة أخرى
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            {/* Viewfinder overlay */}
            <div className="relative">
              <div
                id={divId}
                className="w-full rounded-2xl overflow-hidden"
                style={{ minHeight: 240 }}
              />
              {scanning && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner brackets */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
                  {/* Scan line animation */}
                  <div className="absolute left-4 right-4 h-0.5 bg-blue-400 opacity-80 animate-scan-line" />
                </div>
              )}
            </div>
            <p className="text-white/60 text-center text-sm mt-4">وجّه الكاميرا نحو الباركود</p>
          </div>
        )}
      </div>

      {/* Manual entry */}
      <div className="px-4 pb-8 pt-3">
        <ManualBarcode onSubmit={(code) => { onScan(code); handleClose(); }} />
      </div>
    </div>
  );
}

function ManualBarcode({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [val, setVal] = useState('');
  return (
    <div className="flex gap-2">
      <input
        className="flex-1 bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-center tracking-widest"
        placeholder="أو أدخل الباركود يدوياً..."
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onSubmit(val.trim()); setVal(''); } }}
        dir="ltr"
      />
      <button
        onClick={() => { if (val.trim()) { onSubmit(val.trim()); setVal(''); } }}
        className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition active:scale-95"
      >
        تأكيد
      </button>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type VirtualTryOnModalProps = {
  open: boolean;
  onClose: () => void;
  productName: string;
  tintHex: string;
};

const PRESETS = [
  { id: 'lip', label: 'Lips', x: 50, y: 58, w: 30, h: 11 },
  { id: 'cheekL', label: 'Cheek L', x: 30, y: 50, w: 18, h: 16 },
  { id: 'cheekR', label: 'Cheek R', x: 70, y: 50, w: 18, h: 16 },
  { id: 'lid', label: 'Lids', x: 50, y: 40, w: 38, h: 14 },
] as const;

function normalizeHex(input: string, fallback: string) {
  const t = (input || '').trim();
  return /^#[0-9A-Fa-f]{6}$/.test(t) ? t : fallback;
}

export default function VirtualTryOnModal({ open, onClose, productName, tintHex }: VirtualTryOnModalProps) {
  const fallback = '#db2777';
  const tint = normalizeHex(tintHex, fallback);

  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [x, setX] = useState(50);
  const [y, setY] = useState(58);
  const [wPct, setWPct] = useState(30);
  const [hPct, setHPct] = useState(11);
  const [opacity, setOpacity] = useState(0.52);
  const [blend, setBlend] = useState<'soft-light' | 'multiply' | 'color'>('soft-light');

  const wrapRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const offsetRef = useRef({ dx: 0, dy: 0 });

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  useEffect(() => {
    if (!open) {
      setFileUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setX(50);
      setY(58);
      setWPct(30);
      setHPct(11);
      setOpacity(0.52);
      setBlend('soft-light');
    }
  }, [open]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith('image/')) return;
    if (f.size > 8 * 1024 * 1024) {
      alert('Please choose an image under 8 MB.');
      return;
    }
    setFileUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  };

  const applyPreset = useCallback((p: (typeof PRESETS)[number]) => {
    setX(p.x);
    setY(p.y);
    setWPct(p.w);
    setHPct(p.h);
  }, []);

  const onOverlayPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    offsetRef.current = { dx: px - x, dy: py - y };
    draggingRef.current = true;
  };

  useEffect(() => {
    if (!open) return;
    const move = (e: PointerEvent) => {
      if (!draggingRef.current || !wrapRef.current) return;
      const rect = wrapRef.current.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100 - offsetRef.current.dx;
      const py = ((e.clientY - rect.top) / rect.height) * 100 - offsetRef.current.dy;
      setX(Math.min(100, Math.max(0, px)));
      setY(Math.min(100, Math.max(0, py)));
    };
    const up = () => {
      draggingRef.current = false;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-black/10"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tryon-title"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur-sm">
          <div>
            <h2 id="tryon-title" className="text-lg font-bold text-gray-900">
              Try it on
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{productName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed bg-pink-50/80 border border-pink-100 rounded-xl px-3 py-2">
            <strong className="text-pink-800">Privacy:</strong> your photo stays in this browser — nothing is uploaded to
            our servers. This is a fun preview: drag the tint to match your features, then adjust strength and blend.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your photo</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              onChange={onFile}
              className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-pink-500 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-pink-600"
            />
          </div>

          {!fileUrl ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-16 text-center text-sm text-gray-500">
              Upload a clear face photo to preview this shade.
            </div>
          ) : (
            <>
              <div
                ref={wrapRef}
                className="relative mx-auto inline-block max-w-full select-none rounded-2xl overflow-hidden bg-gray-900/5 ring-1 ring-gray-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl} alt="Your upload" className="block max-h-[min(52vh,420px)] w-auto max-w-full" draggable={false} />
                <div className="absolute inset-0 pointer-events-none">
                  <button
                    type="button"
                    onPointerDown={onOverlayPointerDown}
                    className="pointer-events-auto absolute cursor-grab touch-none active:cursor-grabbing rounded-full border-2 border-white/80 shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${wPct}%`,
                      height: `${hPct}%`,
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: tint,
                      opacity,
                      mixBlendMode: blend,
                      filter: 'blur(0.5px)',
                    }}
                    aria-label="Drag to position try-on tint"
                  />
                </div>
              </div>
              <p className="text-[11px] text-center text-gray-500">Drag the coloured oval to place the product tint.</p>

              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Quick placement</p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-pink-300 hover:bg-pink-50 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-gray-700">
                  Width {wPct}%
                  <input
                    type="range"
                    min={8}
                    max={55}
                    value={wPct}
                    onChange={(e) => setWPct(Number(e.target.value))}
                    className="mt-1 w-full accent-pink-600"
                  />
                </label>
                <label className="block text-xs font-semibold text-gray-700">
                  Height {hPct}%
                  <input
                    type="range"
                    min={6}
                    max={40}
                    value={hPct}
                    onChange={(e) => setHPct(Number(e.target.value))}
                    className="mt-1 w-full accent-pink-600"
                  />
                </label>
                <label className="block text-xs font-semibold text-gray-700 sm:col-span-2">
                  Strength {Math.round(opacity * 100)}%
                  <input
                    type="range"
                    min={15}
                    max={90}
                    value={Math.round(opacity * 100)}
                    onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                    className="mt-1 w-full accent-pink-600"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">Blend mode</label>
                <select
                  value={blend}
                  onChange={(e) => setBlend(e.target.value as typeof blend)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  <option value="soft-light">Soft light (natural)</option>
                  <option value="multiply">Multiply (deeper)</option>
                  <option value="color">Colour (bold lip)</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

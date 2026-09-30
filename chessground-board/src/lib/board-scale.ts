import { useCallback, useState } from 'react';

// Ukuran papan dikontrol lewat skala terhadap lebar dasar (BASE_BOARD_PX), disimpan di
// localStorage supaya pilihan ukuran nempel antar-halaman & antar-reload - pola yang sama dengan
// board-ui-store di Ply (rentang + step + persist), tapi tanpa zustand biar dependency gak nambah.
// Di layar sempit papan tetap dibatasi lebar kolom (w-full), jadi slider cuma terasa di desktop.
export const BASE_BOARD_PX = 640;
export const MIN_BOARD_SCALE = 0.6;
export const MAX_BOARD_SCALE = 1.4;
const DEFAULT_SCALE = 1;
const STEP = 0.05;
const KEY = 'chess-board-scale';

const clamp = (v: number) =>
  Number.isNaN(v) ? DEFAULT_SCALE : Math.round(Math.min(MAX_BOARD_SCALE, Math.max(MIN_BOARD_SCALE, v)) * 100) / 100;

function read(): number {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === null ? DEFAULT_SCALE : clamp(Number(raw));
  } catch {
    return DEFAULT_SCALE;
  }
}

export function useBoardScale() {
  const [scale, setScaleState] = useState(read);

  const setScale = useCallback((next: number) => {
    const v = clamp(next);
    setScaleState(v);
    try {
      localStorage.setItem(KEY, String(v));
    } catch {
      // private mode - slider tetap jalan, cuma gak kesimpen
    }
  }, []);

  const nudge = useCallback((dir: 1 | -1) => setScale(scale + dir * STEP), [scale, setScale]);

  return { scale, setScale, nudge };
}

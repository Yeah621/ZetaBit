import type { Key } from '@lichess-org/chessground/types';

// Geometri papan yang murni (tanpa React/DOM) supaya bisa dites terpisah: konversi nama kotak <->
// titik, bentuk panah (termasuk tekukan kuda), dan posisi label koordinat. Semua dalam satuan
// "1 kotak = 1", papan 8x8 (viewBox SVG 0 0 8 8), titik (0,0) = pojok kiri-atas layar.
export type Pt = [number, number];
export type Orientation = 'white' | 'black';

export const FILES = 'abcdefgh';
export const fileOf = (k: Key) => FILES.indexOf(k[0]);
export const rankOf = (k: Key) => Number(k[1]) - 1;

export const LINE = 0.16; // tebal garis panah
export const HEAD_LEN = 0.4;
export const HEAD_HALF = 0.27;

/** Titik tengah sebuah kotak, memperhitungkan orientasi papan. */
export function projectKey(k: Key, orientation: Orientation): Pt {
  const white = orientation === 'white';
  const f = fileOf(k);
  const r = rankOf(k);
  return [(white ? f : 7 - f) + 0.5, (white ? 7 - r : r) + 0.5];
}

/** Titik (px relatif ke pojok kiri-atas papan) -> nama kotak, atau null kalau di luar papan. */
export function keyFromPoint(px: number, py: number, width: number, height: number, orientation: Orientation): Key | null {
  if (!(width > 0 && height > 0)) return null;
  const col = Math.floor((px / width) * 8);
  const row = Math.floor((py / height) * 8);
  if (!(col >= 0 && col <= 7 && row >= 0 && row <= 7)) return null; // NaN juga jatuh ke sini
  const white = orientation === 'white';
  return `${FILES[white ? col : 7 - col]}${white ? 8 - row : row + 1}` as Key;
}

export function isKnightMove(a: Key, b: Key): boolean {
  const df = Math.abs(fileOf(a) - fileOf(b));
  const dr = Math.abs(rankOf(a) - rankOf(b));
  return (df === 1 && dr === 2) || (df === 2 && dr === 1);
}

export interface ArrowGeometry {
  /** Atribut `d` untuk garis (berhenti di pangkal kepala panah). */
  path: string;
  /** Atribut `points` untuk kepala panah (segitiga). */
  head: string;
}

/**
 * Bentuk panah dari `orig` ke `dest`. Pola gerakan kuda (1x2 / 2x1) menekuk kayak Chess.com:
 * jalan dulu sepanjang sisi yang 2 kotak, baru belok 1 kotak ke tujuan. Selain itu lurus.
 */
export function arrowGeometry(orig: Key, dest: Key, orientation: Orientation): ArrowGeometry | null {
  if (orig === dest) return null;
  const from = projectKey(orig, orientation);
  const to = projectKey(dest, orientation);
  const dr = Math.abs(rankOf(orig) - rankOf(dest));
  const corner: Pt | null = isKnightMove(orig, dest) ? (dr === 2 ? [from[0], to[1]] : [to[0], from[1]]) : null;
  const prev = corner ?? from; // segmen terakhir menentukan arah kepala panah
  const len = Math.hypot(to[0] - prev[0], to[1] - prev[1]);
  const ux = (to[0] - prev[0]) / len;
  const uy = (to[1] - prev[1]) / len;
  const base: Pt = [to[0] - ux * HEAD_LEN, to[1] - uy * HEAD_LEN];
  const nx = -uy;
  const ny = ux;
  return {
    path: `M ${from[0]} ${from[1]}${corner ? ` L ${corner[0]} ${corner[1]}` : ''} L ${base[0]} ${base[1]}`,
    head: `${to[0]},${to[1]} ${base[0] + nx * HEAD_HALF},${base[1] + ny * HEAD_HALF} ${base[0] - nx * HEAD_HALF},${base[1] - ny * HEAD_HALF}`,
  };
}

export interface CoordLabel {
  text: string;
  x: number;
  y: number;
  anchor: 'start' | 'end';
  /** true = label ada di kotak terang (pakai warna gelap), false = di kotak gelap (warna terang). */
  onLight: boolean;
}

// a1 gelap, jadi kotak terang kalau (file + rank) ganjil (indeks 0-based).
const isLight = (fileIdx: number, rankIdx: number) => (fileIdx + rankIdx) % 2 === 1;

/** Label koordinat di dalam kotak tepi: angka rank di pojok kiri-atas kolom kiri, huruf file di pojok kanan-bawah baris bawah. */
export function coordinateLabels(orientation: Orientation): CoordLabel[] {
  const white = orientation === 'white';
  const out: CoordLabel[] = [];
  for (let i = 0; i < 8; i++) {
    const rank = white ? 8 - i : i + 1; // rank pada baris layar ke-i
    const leftFile = white ? 0 : 7; // file pada kolom layar paling kiri
    out.push({ text: String(rank), x: 0.07, y: i + 0.3, anchor: 'start', onLight: isLight(leftFile, rank - 1) });

    const file = white ? i : 7 - i; // file pada kolom layar ke-i
    const bottomRank = white ? 0 : 7; // rank (0-based) pada baris layar paling bawah
    out.push({ text: FILES[file], x: i + 0.93, y: 7.93, anchor: 'end', onLight: isLight(file, bottomRank) });
  }
  return out;
}

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Chessground } from '@lichess-org/chessground';
import type { Config } from '@lichess-org/chessground/config';
import type { Key } from '@lichess-org/chessground/types';
// Ganti baris di bawah buat pakai piece set lain (lihat README bagian "Mengganti piece set").
import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';
import { LINE, arrowGeometry, coordinateLabels, keyFromPoint, projectKey } from '../lib/board-geometry';
import type { Orientation } from '../lib/board-geometry';

// `Api` gak di-export dari entry utama package (TS2459) - diturunkan dari return type Chessground().
type Api = ReturnType<typeof Chessground>;

export interface ChessBoardHandle {
  toggleOrientation: () => void;
  getApi: () => Api | null;
  /** Hapus semua panah & penanda kotak yang digambar. */
  clearShapes: () => void;
}

interface Props {
  config?: Config;
  /** true = geser (jari/mouse) di papan menggambar panah, bukan menggerakkan bidak. */
  drawMode?: boolean;
}

// Panah atau penanda kotak. Tanpa `dest` (atau dest == orig) = penanda kotak.
interface Shape {
  orig: Key;
  dest?: Key;
}

// Panah ikut warna aksen website (berubah bareng tema). Penanda kotak = merah kayak Chess.com.
const ARROW_COLOR = 'var(--accent)';
const SQUARE_COLOR = '#eb6150';

const sameShape = (a: Shape, b: Shape) => a.orig === b.orig && (a.dest ?? a.orig) === (b.dest ?? b.orig);
const isSquare = (s: Shape) => !s.dest || s.dest === s.orig;

// Penanda kotak: seluruh petak diwarnai merah (bukan lingkaran). Dirender di layer DI BAWAH bidak.
function SquareView({ shape, orientation }: { shape: Shape; orientation: Orientation }) {
  const [x, y] = projectKey(shape.orig, orientation);
  return <rect x={x - 0.5} y={y - 0.5} width={1} height={1} fill={SQUARE_COLOR} opacity={0.7} />;
}

// Panah digambar sendiri (SVG di atas papan), bukan lewat drawable bawaan Chessground, karena
// bawaan Chessground cuma bisa garis lurus - gerakan kuda gak bisa menekuk kayak Chess.com.
function ArrowView({ shape, orientation }: { shape: Shape; orientation: Orientation }) {
  const geo = shape.dest ? arrowGeometry(shape.orig, shape.dest, orientation) : null;
  if (!geo) return null;
  return (
    <g opacity={0.85}>
      <path d={geo.path} fill="none" strokeWidth={LINE} strokeLinejoin="round" style={{ stroke: ARROW_COLOR }} />
      <polygon points={geo.head} style={{ fill: ARROW_COLOR }} />
    </g>
  );
}

// Wrapper tipis & imperative: Chessground kelola DOM papannya sendiri (bukan lewat React
// render), jadi ini cuma mount sekali lalu bicara ke instance-nya lewat `.set()`.
const ChessBoard = forwardRef<ChessBoardHandle, Props>(function ChessBoard({ config, drawMode = false }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const dragFrom = useRef<Key | null>(null);

  const [orientation, setOrientation] = useState<Orientation>(config?.orientation ?? 'white');
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [preview, setPreview] = useState<Shape | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    // drawable & koordinat bawaan dimatikan: panah/penanda kotak/label koordinat digambar layer SVG
    // di bawah. Koordinat bawaan Chessground mengambang DI LUAR papan, jadi terpotong oleh
    // `overflow-hidden` di BoardFrame; versi sendiri ada di dalam kotak tepi (kayak Chess.com/Ply).
    const api = Chessground(el, { coordinates: false, drawable: { enabled: false }, ...config });
    apiRef.current = api;
    // Kalau ukuran wadah berubah (slider ukuran, resize jendela) Chessground perlu tahu supaya
    // posisi bidak dihitung ulang. Versi baru sudah observe sendiri; event ini (dipakai Lichess)
    // jaga-jaga buat versi yang belum, dan aman kalau dikirim dobel.
    const observer = new ResizeObserver(() => {
      document.body.dispatchEvent(new Event('chessground.resize'));
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      api.destroy();
      apiRef.current = null;
    };
    // Sengaja cuma jalan sekali di mount - update berikutnya lewat effect di bawah (.set()),
    // bukan remount, biar animasi & state internal Chessground gak kereset tiap render React.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (config) apiRef.current?.set(config);
  }, [config]);

  // Premove (aktif kalau config.premovable dikirim, mis. di FriendRoom): jalankan begitu giliran
  // balik ke kita. PENTING: playPremove() cuma boleh dipanggil saat giliran kita - kalau dipanggil
  // saat masih giliran lawan, Chessground menganggap premove-nya gagal dan MENGHAPUSNYA.
  // Harus di bawah effect set(config) supaya `dests` giliran kita sudah terpasang.
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !config?.premovable) return;
    if (!config.premovable.enabled) {
      api.cancelPremove(); // putus/game selesai: jangan biarkan premove basi nyangkut
      return;
    }
    const st = api.state;
    if (st.premovable.current && st.turnColor === st.movable.color) api.playPremove();
  }, [config]);

  useEffect(() => {
    if (config?.orientation) setOrientation(config.orientation);
  }, [config?.orientation]);

  // Panah & penanda kotak hilang begitu posisi berubah (ada langkah baru), sama kayak Lichess/Chess.com.
  const fen = config?.fen;
  useEffect(() => {
    setShapes((cur) => (cur.length ? [] : cur));
  }, [fen]);

  useImperativeHandle(ref, () => ({
    toggleOrientation: () => {
      apiRef.current?.toggleOrientation();
      setOrientation((o) => (o === 'white' ? 'black' : 'white'));
    },
    getApi: () => apiRef.current,
    clearShapes: () => setShapes([]),
  }));

  // Posisi pointer -> nama kotak.
  const keyAt = (e: ReactPointerEvent<HTMLDivElement>): Key | null => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return keyFromPoint(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height, orientation);
  };

  // Gambar yang sama dua kali = dihapus (toggle), sama kayak klik-kanan di Lichess/Chess.com.
  const toggleShape = (s: Shape) =>
    setShapes((cur) => (cur.some((x) => sameShape(x, s)) ? cur.filter((x) => !sameShape(x, s)) : [...cur, s]));

  // Klik-kanan (desktop) atau mode Panah (jari/mouse) = menggambar. Klik kiri biasa = bersihkan
  // gambar sambil tetap menggerakkan bidak seperti biasa.
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!(drawMode || e.button === 2)) {
      if (e.button === 0) setShapes((cur) => (cur.length ? [] : cur));
      return;
    }
    const k = keyAt(e);
    if (!k) return;
    dragFrom.current = k;
    setPreview({ orig: k });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const from = dragFrom.current;
    if (!from) return;
    const to = keyAt(e);
    const dest = to && to !== from ? to : undefined;
    setPreview((p) => (p && p.dest === dest ? p : { orig: from, ...(dest ? { dest } : {}) }));
  };

  const finish = (e: ReactPointerEvent<HTMLDivElement>, commit: boolean) => {
    const from = dragFrom.current;
    dragFrom.current = null;
    setPreview(null);
    if (!from || !commit) return;
    const to = keyAt(e);
    if (to) toggleShape({ orig: from, ...(to !== from ? { dest: to } : {}) });
  };

  return (
    <div
      ref={containerRef}
      className="relative isolate h-full w-full select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => finish(e, true)}
      onPointerCancel={(e) => finish(e, false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div ref={wrapRef} className="cg-wrap h-full w-full" />
      {/* Layer bawah: penanda kotak + label koordinat, di bawah bidak (z-index bidak Chessground = 2). */}
      <svg viewBox="0 0 8 8" className="pointer-events-none absolute inset-0 z-[1] h-full w-full" aria-hidden="true">
        {shapes.filter(isSquare).map((s) => (
          <SquareView key={s.orig} shape={s} orientation={orientation} />
        ))}
        {preview && isSquare(preview) && (
          <g opacity={0.7}>
            <SquareView shape={preview} orientation={orientation} />
          </g>
        )}
        {coordinateLabels(orientation).map((l) => (
          <text
            key={`${l.text}${l.x}`}
            x={l.x}
            y={l.y}
            textAnchor={l.anchor}
            fontSize={0.27}
            fontWeight={600}
            style={{ fill: l.onLight ? 'var(--board-dark)' : 'var(--board-light)', fontFamily: 'var(--font-sans)' }}
          >
            {l.text}
          </text>
        ))}
      </svg>
      {/* Layer atas: panah, di atas bidak. */}
      <svg viewBox="0 0 8 8" className="pointer-events-none absolute inset-0 z-[5] h-full w-full" aria-hidden="true">
        {shapes
          .filter((s) => !isSquare(s))
          .map((s) => (
            <ArrowView key={`${s.orig}-${s.dest}`} shape={s} orientation={orientation} />
          ))}
        {preview && !isSquare(preview) && (
          <g opacity={0.7}>
            <ArrowView shape={preview} orientation={orientation} />
          </g>
        )}
      </svg>
      {/* Menutup papan selama mode Panah supaya bidak gak ikut kegeser; event-nya tetap sampai ke wadah. */}
      {drawMode && <div className="absolute inset-0 z-10 cursor-crosshair touch-none" />}
    </div>
  );
});

export default ChessBoard;

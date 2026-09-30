import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowUpRight, Eraser, Minus, Plus } from 'lucide-react';
import type { Config } from '@lichess-org/chessground/config';
import ChessBoard from './ChessBoard';
import type { ChessBoardHandle } from './ChessBoard';
import { Button } from './ui/button';
import { BASE_BOARD_PX, MAX_BOARD_SCALE, MIN_BOARD_SCALE, useBoardScale } from '../lib/board-scale';

const nudgeBtn =
  'flex size-6 shrink-0 items-center justify-center rounded-full text-[var(--ink-muted)] transition-colors hover:bg-[var(--bg-elevated-2)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-30';

interface Props {
  config: Config;
  ready: boolean;
  /** Konten di atas papan (mis. strip pemain lawan). */
  before?: ReactNode;
  /** Konten di bawah papan, di atas kontrol (mis. strip pemain sendiri). */
  after?: ReactNode;
}

// Papan + kontrolnya (slider ukuran ala Ply, mode gambar panah, hapus panah) dalam satu unit,
// dipakai Home, Game, dan FriendRoom supaya perilakunya sama di semua halaman.
export function BoardFrame({ config, ready, before, after }: Props) {
  const boardRef = useRef<ChessBoardHandle>(null);
  const [drawMode, setDrawMode] = useState(false);
  const { scale, setScale, nudge } = useBoardScale();

  return (
    <section className="mx-auto flex w-full flex-col gap-3" style={{ maxWidth: BASE_BOARD_PX * scale }}>
      {before}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.35)]">
        <div className="aspect-square w-full">
          {ready ? (
            <ChessBoard ref={boardRef} config={config} drawMode={drawMode} />
          ) : (
            <div className="shimmer h-full w-full" />
          )}
        </div>
      </div>
      {after}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant={drawMode ? 'default' : 'outline'}
            size="sm"
            aria-pressed={drawMode}
            onClick={() => setDrawMode((v) => !v)}
          >
            <ArrowUpRight className="size-3.5" />
            Panah
          </Button>
          <Button variant="ghost" size="sm" onClick={() => boardRef.current?.clearShapes()}>
            <Eraser className="size-3.5" />
            Hapus
          </Button>
        </div>
        {drawMode && (
          <p className="px-1 text-xs text-[var(--ink-muted)]">
            Geser dari satu kotak ke kotak lain untuk panah (gerakan kuda otomatis menekuk), ketuk satu kotak untuk
            menandainya merah. Bidak tidak bisa digerakkan selama mode ini aktif.
          </p>
        )}

        <div className="flex items-center gap-2 px-1">
          <button
            type="button"
            onClick={() => nudge(-1)}
            disabled={scale <= MIN_BOARD_SCALE}
            aria-label="Perkecil papan"
            className={nudgeBtn}
          >
            <Minus className="size-3.5" />
          </button>
          <input
            type="range"
            min={MIN_BOARD_SCALE}
            max={MAX_BOARD_SCALE}
            step={0.05}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            aria-label="Ukuran papan"
            className="board-size-slider min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={() => nudge(1)}
            disabled={scale >= MAX_BOARD_SCALE}
            aria-label="Perbesar papan"
            className={nudgeBtn}
          >
            <Plus className="size-3.5" />
          </button>
          <span className="w-9 shrink-0 text-right font-mono text-[11px] tabular-nums text-[var(--ink-faint)]">
            {Math.round(scale * 100)}%
          </span>
        </div>
      </div>
    </section>
  );
}

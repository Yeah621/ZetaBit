import { useCallback, useRef } from 'react';
import ChessBoard, { type ChessBoardHandle } from '../components/ChessBoard';
import TopBar from '../components/TopBar';
import type { Config } from '@lichess-org/chessground/config';
import type { Key } from '@lichess-org/chessground/types';
import { useChessGame } from '../hooks/useChessGame';

interface GameProps {
  /** Only 'local' is wired up so far - 'friend' / 'ai' arrive with Fase 3-5,
   * once there's a backend to actually run them against. */
  mode: 'local';
}

export default function Game({ mode }: GameProps) {
  const boardRef = useRef<ChessBoardHandle>(null);
  const game = useChessGame();

  const handleFlip = useCallback(() => {
    boardRef.current?.toggleOrientation();
  }, []);

  const handleReset = useCallback(() => {
    game.reset();
  }, [game.reset]);

  // Fase 1: Chessground now only offers squares that are actually in
  // `dests` (movable.free: false below), so by the time this fires the
  // move is already known-legal - just advance the real game state.
  // Promotion always auto-queens for now; a picker UI is Phase 6.
  const handleAfterMove = useCallback(
    (orig: Key, dest: Key) => {
      game.tryMove(orig, dest);
    },
    [game.tryMove],
  );

  // `fen` / `turnColor` / `movable.color` are only spread in once the
  // wasm game has actually loaded (`game.ready`). Leaving them OUT
  // entirely (rather than passing `fen: undefined`) matters on the first
  // render: this object gets merged into ChessBoard's own defaults, and
  // an explicit `undefined` would override those defaults instead of
  // being ignored, briefly wiping the start position.
  const config: Config = {
    ...(game.boardFen !== undefined ? { fen: game.boardFen } : {}),
    ...(game.turn !== undefined ? { turnColor: game.turn } : {}),
    check: game.check,
    lastMove: game.lastMove,
    movable: {
      free: false,
      dests: game.dests,
      ...(game.turn !== undefined ? { color: game.turn } : {}),
      showDests: true,
      events: { after: handleAfterMove },
    },
  };

  const resultText = game.checkmate
    ? `Skakmat - ${game.turn === 'white' ? 'Hitam' : 'Putih'} menang`
    : game.stalemate
      ? 'Stalemate - remis'
      : game.insufficientMaterial
        ? 'Remis - sisa bidak tidak cukup'
        : null;

  const turnLabel = mode === 'local' ? (game.turn === 'white' ? 'Giliran Putih' : 'Giliran Hitam') : '';

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-base">
      {/* Atmosphere: the same soft-glow-behind-things trick as Home's
          hero (see the `-z-10` blur circle in Home.tsx), just toned down
          since this is a content page, not a hero moment. overflow-hidden
          on this root is why TopBar isn't sticky - see its own comment. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 -z-10 h-[26rem] w-[26rem] rounded-full bg-accent/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-24 -z-10 h-[26rem] w-[26rem] rounded-full bg-lavender/10 blur-3xl"
      />

      <TopBar backTo="/" backLabel="Beranda" />

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-20 pt-6 sm:pt-10 lg:flex-row lg:items-start lg:justify-center lg:gap-12">
        <div className="board-frame mx-auto w-full max-w-[600px] shrink-0 sm:max-w-[640px] lg:max-w-[680px]">
          <div className="board-frame-inner aspect-square w-full">
            <ChessBoard ref={boardRef} config={config} />
          </div>
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-72 lg:pt-2">
          <div className="glass-panel rounded-2xl px-5 py-4">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${game.turn === 'white' ? 'bg-white ring-1 ring-border' : 'bg-hero-to'}`}
                aria-hidden="true"
              />
              <span className="font-heading text-sm font-semibold text-text-primary">
                {game.ready ? turnLabel : 'Memuat...'}
              </span>
            </div>
            {resultText && <p className="mt-2 font-heading text-sm font-semibold text-accent">{resultText}</p>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleFlip}
              className="btn-gold flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-heading font-semibold active:scale-95"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              Flip board
            </button>
            <button
              onClick={handleReset}
              className="btn-ghost flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-heading font-semibold active:scale-95"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M3 6h13a4 4 0 0 1 0 8H8" />
                <path d="M7 10 3 6l4-4" />
              </svg>
              Reset
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

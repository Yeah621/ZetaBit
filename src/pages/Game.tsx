import { useCallback, useRef } from 'react';
import { Link } from 'react-router';
import ChessBoard, { type ChessBoardHandle } from '../components/ChessBoard';
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
    <div className="min-h-screen bg-bg-base">
      <header className="flex items-center px-6 py-5 sm:px-10">
        <Link to="/" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
          ← Home
        </Link>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 pb-16 lg:flex-row lg:items-start lg:justify-center">
        <div className="mx-auto w-full max-w-[560px] shrink-0 rounded-sm shadow-2xl ring-1 ring-black/40">
          <div className="aspect-square w-full">
            <ChessBoard ref={boardRef} config={config} />
          </div>
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-64">
          <div className="glass-panel rounded-2xl px-5 py-4">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${game.turn === 'white' ? 'bg-white ring-1 ring-border' : 'bg-hero-to'}`}
                aria-hidden="true"
              />
              <span className="text-sm text-text-primary">{game.ready ? turnLabel : 'Memuat...'}</span>
            </div>
            {resultText && <p className="mt-2 text-sm font-medium text-accent">{resultText}</p>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleFlip}
              className="flex-1 rounded-xl border border-border bg-bg-raised px-4 py-2 text-sm font-medium text-text-primary transition active:scale-95"
            >
              Flip board
            </button>
            <button
              onClick={handleReset}
              className="flex-1 rounded-xl border border-border px-4 py-2 text-sm font-medium text-text-secondary transition hover:text-text-primary active:scale-95"
            >
              Reset
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

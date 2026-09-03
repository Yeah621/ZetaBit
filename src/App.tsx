import { useCallback, useRef } from 'react';
import ChessBoard, { type ChessBoardHandle } from './components/ChessBoard';
import type { Config } from '@lichess-org/chessground/config';
import type { Key } from '@lichess-org/chessground/types';
import { useChessGame } from './hooks/useChessGame';

export default function App() {
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
    ? `Checkmate - ${game.turn === 'white' ? 'Black' : 'White'} wins`
    : game.stalemate
      ? 'Stalemate'
      : game.insufficientMaterial
        ? 'Draw - insufficient material'
        : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-900 p-6">
      <div className="aspect-square w-full max-w-[560px] rounded-sm shadow-2xl ring-1 ring-black/40">
        <ChessBoard ref={boardRef} config={config} />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleFlip}
          className="rounded-md bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-white active:scale-95"
        >
          Flip board
        </button>
        <button
          onClick={handleReset}
          className="rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-100 ring-1 ring-neutral-600 transition hover:bg-neutral-700 active:scale-95"
        >
          Reset
        </button>
      </div>

      {resultText && <p className="text-sm text-neutral-300">{resultText}</p>}
    </div>
  );
}

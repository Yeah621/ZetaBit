import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Chessground } from '@lichess-org/chessground';
import type { Api } from '@lichess-org/chessground/api';
import type { Config } from '@lichess-org/chessground/config';

// Structural CSS (required) + the default piece set bundled with the
// package: cburnett, lichess.org's own default set, GPL-licensed like the
// rest of chessground. See README -> "Mengganti piece set" to swap it out.
import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';

// Our own board-color + coordinate theme (Chess.com palette). This file
// intentionally REPLACES chessground's own theme css (e.g. the default
// chessground.brown.css) - don't import both, they'd fight over `cg-board`.
import '../styles/chessground-theme.css';

/** Starting position, piece placement only (no turn/castling/ep flags). */
export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

export interface ChessBoardHandle {
  /** Escape hatch: grab the raw Chessground API for anything this wrapper doesn't expose. */
  getApi: () => Api | undefined;
  /** Flip the board's point of view. */
  toggleOrientation: () => void;
}

export interface ChessBoardProps {
  /** Any valid Chessground config, shallow-merged over the defaults below. */
  config?: Config;
  /** Applied to the mounted host element. Defaults to filling its parent. */
  className?: string;
}

const defaultConfig: Config = {
  fen: START_FEN,
  orientation: 'white',
  coordinates: true,
  animation: {
    enabled: true,
    duration: 200,
  },
  highlight: {
    lastMove: true,
    check: true,
  },
  movable: {
    // free + both = zero chess logic, any piece can go anywhere.
    // Swap for `free: false` + a real `dests` map once your rules engine
    // (chess.js, chessops, your own backend, ...) is wired up.
    free: true,
    color: 'both',
    showDests: true,
  },
  draggable: {
    enabled: true,
    showGhost: true,
  },
  selectable: {
    enabled: true,
  },
};

/**
 * Thin, imperative-friendly React wrapper around Chessground.
 *
 * Chessground owns its own DOM once mounted (it does its own diffing), so
 * this component mounts it exactly once in an effect and afterwards only
 * ever talks to it through `.set()` / the imperative handle - it never lets
 * React re-render into the host div.
 */
const ChessBoard = forwardRef<ChessBoardHandle, ChessBoardProps>(function ChessBoard(
  { config, className },
  ref,
) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<Api | undefined>(undefined);

  useEffect(() => {
    if (!hostRef.current) return;

    apiRef.current = Chessground(hostRef.current, { ...defaultConfig, ...config });

    // Chessground's own layout is fluid (%-based internally), so square
    // sizing resizes for free. This just keeps the SVG drawing layer
    // (arrows/circles, if you turn `drawable` on) pixel-crisp after resize.
    const handleResize = () => apiRef.current?.redrawAll();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      apiRef.current?.destroy();
      apiRef.current = undefined;
    };
    // Intentionally mount-once: see the effect below for reactive updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push further config changes (lastMove, checks, a new fen, ...) into the
  // already-running instance via `.set()` instead of remounting, so piece
  // animations keep playing correctly.
  useEffect(() => {
    if (!apiRef.current || !config) return;
    apiRef.current.set(config);
  }, [config]);

  useImperativeHandle(
    ref,
    () => ({
      getApi: () => apiRef.current,
      toggleOrientation: () => apiRef.current?.toggleOrientation(),
    }),
    [],
  );

  return <div ref={hostRef} className={className ?? 'h-full w-full'} />;
});

export default ChessBoard;

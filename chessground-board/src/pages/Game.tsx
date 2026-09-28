import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import type { Config } from '@lichess-org/chessground/config';
import type { Key } from '@lichess-org/chessground/types';
import ChessBoard from '../components/ChessBoard';
import { AppHeader } from '../components/app-header';
import { ThemeToggle } from '../components/theme-toggle';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useChessGame } from '../hooks/useChessGame';

export default function Game() {
  const { ready, boardFen, turn, check, lastMove, dests, gameOver, checkmate, stalemate, insufficientMaterial, tryMove, reset } =
    useChessGame();
  const live = ready && !gameOver;

  // Pass & Play: movable.color ngikutin giliran (beda dari FriendRoom yang dikunci ke warna sendiri).
  const config = useMemo<Config>(
    () => ({
      ...(boardFen !== undefined ? { fen: boardFen } : {}),
      ...(turn !== undefined ? { turnColor: turn } : {}),
      check,
      lastMove,
      movable: {
        free: false,
        dests: live ? dests : new Map<Key, Key[]>(),
        ...(live && turn ? { color: turn } : {}),
        showDests: true,
        events: {
          after: (orig: Key, dest: Key) => {
            tryMove(orig, dest);
          },
        },
      },
    }),
    [boardFen, turn, check, lastMove, dests, live, tryMove],
  );

  const who = turn === 'white' ? 'Putih' : 'Hitam';
  const result = checkmate
    ? `Skakmat — ${turn === 'white' ? 'Hitam' : 'Putih'} menang`
    : stalemate
      ? 'Stalemate — remis'
      : insufficientMaterial
        ? 'Remis — sisa bidak tidak cukup'
        : null;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1400px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-10">
      <AppHeader
        subtitle="Pass & Play"
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ArrowLeft className="size-3.5" />
                Home
              </Link>
            </Button>
            <ThemeToggle />
          </>
        }
      />

      <main className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="mx-auto w-full max-w-[640px]">
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.35)]">
            <div className="aspect-square w-full">
              {ready ? <ChessBoard config={config} /> : <div className="shimmer h-full w-full" />}
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-5">
          <Card className="p-4" role="status" aria-live="polite">
            <p className="text-xs text-[var(--ink-muted)]">{result ? 'Hasil' : 'Giliran'}</p>
            {result ? (
              <p className="font-display mt-1 text-lg font-medium tracking-[-0.01em]">{result}</p>
            ) : (
              <div className="mt-1 flex items-center gap-2.5">
                <span
                  className={`size-4 rounded-full border border-[var(--border-strong)] ${turn === 'white' ? 'bg-[#f5f3ea]' : 'bg-[#1b1d25]'}`}
                  aria-hidden="true"
                />
                <span className="font-display text-lg font-medium tracking-[-0.01em]">{ready ? `${who} jalan` : 'Memuat…'}</span>
                {check && (
                  <span className="ml-auto rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">Skak</span>
                )}
              </div>
            )}
          </Card>
          <Button onClick={reset} disabled={!ready} className="self-start">
            <RotateCcw className="size-4" />
            Game baru
          </Button>
        </aside>
      </main>
    </div>
  );
}

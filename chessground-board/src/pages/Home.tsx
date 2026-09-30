import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router';
import { Bot, ChevronRight, Globe, RotateCcw, Users } from 'lucide-react';
import type { Config } from '@lichess-org/chessground/config';
import type { Key } from '@lichess-org/chessground/types';
import { BoardFrame } from '../components/BoardFrame';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { NotationPanel } from '../components/NotationPanel';
import { useChessGame } from '../hooks/useChessGame';

// Baris satu mode main, gaya menu "Play" Lichess/panel "New Game" Chess.com: ikon + judul +
// subjudul + status di kanan (aktif / panah / "segera"), bukan kartu bento kotak-kotak.
function ModeRow({
  icon,
  title,
  subtitle,
  to,
  active,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  to?: string;
  active?: boolean;
  disabled?: boolean;
}) {
  const row = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] [&_svg]:size-4">
        {icon}
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-[var(--ink-muted)]">{subtitle}</span>
      </span>
      {active && (
        <span className="ml-auto shrink-0 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
          Sedang main
        </span>
      )}
      {disabled && <span className="ml-auto shrink-0 text-xs text-[var(--ink-faint)]">Segera</span>}
      {!active && !disabled && <ChevronRight className="ml-auto size-4 shrink-0 text-[var(--ink-faint)]" />}
    </>
  );
  const cls = 'flex items-center gap-3 px-4 py-3.5 text-left transition';
  if (to) {
    return (
      <Link to={to} className={`${cls} hover:bg-[var(--bg-elevated-2)]`}>
        {row}
      </Link>
    );
  }
  return <div className={`${cls} ${disabled ? 'opacity-50' : 'bg-[var(--bg-elevated-2)]'}`}>{row}</div>;
}

// Home = papan + menu "mau main apa", sama kayak panel Play Lichess / New Game Chess.com -
// bukan landing page. Board-nya sendiri Pass & Play beneran (wiring mirip Game.tsx - lihat
// catatan duplikasi kecil di situ), karena itu opsi yang aktif begitu buka halaman.
export default function Home() {
  const {
    ready,
    boardFen,
    turn,
    check,
    lastMove,
    dests,
    gameOver,
    checkmate,
    stalemate,
    insufficientMaterial,
    tryMove,
    reset,
    moveHistory,
    pgn,
  } = useChessGame();
  const live = ready && !gameOver;

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
      <Navbar />

      <main className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <BoardFrame config={config} ready={ready} />

        <aside className="flex flex-col gap-5">
          <Card className="overflow-hidden">
            <p className="px-4 pb-2 pt-4 text-xs text-[var(--ink-muted)]">Main</p>
            <div className="flex flex-col divide-y divide-[var(--border)] border-t border-[var(--border)]">
              <ModeRow icon={<Users />} title="Main Lokal" subtitle="Satu layar, dua pemain" active />
              <ModeRow icon={<Globe />} title="Main dengan Teman" subtitle="Buat atau gabung room" to="/friend" />
              <ModeRow icon={<Bot />} title="Lawan Komputer" subtitle="Latihan lawan bot" disabled />
            </div>
          </Card>

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
          <Button onClick={reset} disabled={!ready} variant="outline" size="sm" className="self-start">
            <RotateCcw className="size-4" />
            Game baru
          </Button>
          <NotationPanel moveHistory={moveHistory} pgn={pgn} fileName="pass-and-play" />
        </aside>
      </main>
    </div>
  );
}

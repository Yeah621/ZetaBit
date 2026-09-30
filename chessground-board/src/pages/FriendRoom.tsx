import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { BoardFrame } from '../components/BoardFrame';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import { AppHeader } from '../components/app-header';
import { ThemeToggle } from '../components/theme-toggle';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { NotationPanel } from '../components/NotationPanel';
import type { Config } from '@lichess-org/chessground/config';
import type { Key } from '@lichess-org/chessground/types';
import { useChessGame } from '../hooks/useChessGame';
import { BACKEND_URL } from '../config';

type PromotionRole = 'q' | 'r' | 'b' | 'n';
type Color = 'white' | 'black';
type ConnState = 'connecting' | 'open' | 'down';

interface MoveMessage {
  type: 'move';
  orig: string;
  dest: string;
  promotion: PromotionRole | null;
  senderId: string;
}

interface PresenceMessage {
  type: 'presence';
  count: number;
}

type ServerMessage = MoveMessage | PresenceMessage;

// crypto.randomUUID cuma ada di secure context (HTTPS/localhost). Lewat
// http://IP-LAN dari HP dia undefined dan halaman langsung blank - makanya ada fallback.
const makeId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

function PlayerStrip({ color, label, active }: { color: Color; label: string; active: boolean }) {
  return (
    <div className="flex h-8 items-center gap-2.5 px-1">
      <span
        className={`size-4 rounded-full border border-[var(--border-strong)] ${color === 'white' ? 'bg-[#f5f3ea]' : 'bg-[#1b1d25]'}`}
        aria-hidden="true"
      />
      <span className="text-sm font-medium">{label}</span>
      {active && (
        <span className="ml-auto rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent)]">
          Giliran
        </span>
      )}
    </div>
  );
}

export default function FriendRoom() {
  const { code = '' } = useParams<{ code: string }>();
  const game = useChessGame();
  const { ready, boardFen, turn, check, lastMove, dests, gameOver, tryMove, loadFen } = game;
  const wsRef = useRef<WebSocket | null>(null);
  const [conn, setConn] = useState<ConnState>('connecting');
  // null = server belum ngabarin siapa-siapa (jangan langsung bilang "menunggu lawan").
  const [presence, setPresence] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Diisi FriendLobby.tsx pas create ('white') atau join ('black') lewat sessionStorage.
  // Buka link room langsung tanpa lobby -> default 'black' (kasus paling umum: kamu diundang).
  const myColor = useMemo<Color>(
    () => (sessionStorage.getItem(`role:${code}`) as Color | null) ?? 'black',
    [code],
  );

  // Id acak per koneksi buat nyaring gema pesan sendiri (server broadcast ke SEMUA koneksi).
  const clientId = useMemo(makeId, []);

  // Samain papan ke FEN server. Dipanggil tiap socket kebuka (baru/reconnect) DAN pas
  // wasm baru siap - kalau socket kebuka duluan, loadFen sebelumnya diam-diam gagal.
  const resync = useCallback(() => {
    fetch(`${BACKEND_URL}/rooms/${code}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((room: { fen?: string; moves?: string[] } | null) => {
        // `moves` (UCI) opsional - kalau backend sudah ngirim, notasi/PGN pulih utuh walau reload.
        if (room?.fen) loadFen(room.fen, room.moves);
      })
      .catch(() => {
        // gagal resync - biarin state lokal, jangan nge-block UI
      });
  }, [code, loadFen]);

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      if (cancelled) return;
      setConn('connecting');
      const ws = new WebSocket(`${BACKEND_URL.replace(/^http/, 'ws')}/ws/${code}`);
      wsRef.current = ws;

      ws.onopen = () => {
        attempt = 0;
        setConn('open');
        resync();
      };

      ws.onmessage = (event) => {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return; // bukan JSON valid, abaikan
        }
        if (msg.type === 'presence') {
          setPresence(msg.count);
          return;
        }
        if (msg.senderId === clientId) return; // gema pesan sendiri
        if (msg.type === 'move') {
          tryMove(msg.orig as Key, msg.dest as Key, msg.promotion ?? undefined);
        }
      };

      // Putus (wifi hiccup, tab di-background di HP) -> sambung ulang dengan backoff 1s-8s.
      ws.onclose = () => {
        if (cancelled || wsRef.current !== ws) return;
        setConn('down');
        setPresence(null);
        retryTimeout = setTimeout(connect, Math.min(8000, 1000 * 2 ** attempt++));
      };
    };

    // Balik online / tab dibuka lagi: gak usah nunggu timer, langsung coba.
    const wake = () => {
      if (document.visibilityState === 'hidden') return;
      const ws = wsRef.current;
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        clearTimeout(retryTimeout);
        attempt = 0;
        connect();
      }
    };

    connect();
    window.addEventListener('online', wake);
    document.addEventListener('visibilitychange', wake);

    return () => {
      cancelled = true;
      clearTimeout(retryTimeout);
      window.removeEventListener('online', wake);
      document.removeEventListener('visibilitychange', wake);
      wsRef.current?.close();
    };
  }, [code, clientId, resync, tryMove]);

  useEffect(() => {
    if (ready && wsRef.current?.readyState === WebSocket.OPEN) resync();
  }, [ready, resync]);

  const handleAfterMove = useCallback(
    (orig: Key, dest: Key) => {
      const ws = wsRef.current;
      // Papan dikunci saat gak connect, jadi ini cuma jaring pengaman buat race
      // tipis: jangan apply lokal kalau gak bisa dikirim, tarik balik ke FEN server.
      if (ws?.readyState !== WebSocket.OPEN) {
        resync();
        return;
      }
      if (tryMove(orig, dest)) {
        const msg: MoveMessage = { type: 'move', orig, dest, promotion: null, senderId: clientId };
        ws.send(JSON.stringify(msg));
      }
    },
    [tryMove, resync, clientId],
  );

  // `movable.color` DIKUNCI ke warna sendiri (bukan ngikutin giliran kayak Local Pass & Play).
  // Selama belum connect / game selesai, papan read-only supaya gerakan gak "hilang" diam-diam.
  const live = conn === 'open' && ready && !gameOver;
  const config = useMemo<Config>(
    () => ({
      ...(boardFen !== undefined ? { fen: boardFen } : {}),
      ...(turn !== undefined ? { turnColor: turn } : {}),
      orientation: myColor,
      check,
      lastMove,
      movable: {
        free: false,
        dests: live ? dests : new Map<Key, Key[]>(),
        ...(live ? { color: myColor } : {}),
        showDests: true,
        events: { after: handleAfterMove },
      },
      // Premove: gerakkan bidak sendiri saat giliran lawan; dijalankan otomatis begitu lawan jalan
      // (lihat effect playPremove di ChessBoard.tsx). Mati kalau gak connect / game selesai.
      premovable: { enabled: live, showDests: true },
    }),
    [boardFen, turn, check, lastMove, dests, live, myColor, handleAfterMove],
  );

  const opponent: Color = myColor === 'white' ? 'black' : 'white';
  const name = (c: Color) => (c === 'white' ? 'Putih' : 'Hitam');
  const active = ready && !gameOver;

  const result = game.checkmate
    ? `Skakmat — ${turn === 'white' ? 'Hitam' : 'Putih'} menang`
    : game.stalemate
      ? 'Stalemate — remis'
      : game.insufficientMaterial
        ? 'Remis — sisa bidak tidak cukup'
        : null;

  const status =
    conn === 'down'
      ? { ok: false, text: 'Terputus — menyambung ulang…' }
      : conn === 'connecting' || presence === null
        ? { ok: false, text: 'Menghubungkan…' }
        : presence < 2
          ? { ok: false, text: 'Menunggu lawan join — bagikan link room-nya.' }
          : { ok: true, text: 'Lawan terhubung' };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/friend/${code}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard diblokir (mis. http non-secure) - abaikan
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1400px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-10">
      <AppHeader
        subtitle={`Room ${code}`}
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
        <BoardFrame
          config={config}
          ready={ready}
          before={<PlayerStrip color={opponent} label={`Lawan · ${name(opponent)}`} active={active && turn === opponent} />}
          after={<PlayerStrip color={myColor} label={`Kamu · ${name(myColor)}`} active={active && turn === myColor} />}
        />

        <aside className="flex flex-col gap-5">
          <Card className="p-4">
            <p className="text-xs text-[var(--ink-muted)]">Kode room</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="font-mono text-2xl font-medium tracking-[0.2em]">{code}</span>
              <Button variant="outline" size="sm" onClick={copyInvite} aria-label="Salin link undangan">
                {copied ? <Check /> : <Copy />}
                {copied ? 'Tersalin' : 'Salin link'}
              </Button>
            </div>
            <div role="status" aria-live="polite" className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3 text-sm">
              <span
                className={`size-2 shrink-0 rounded-full ${status.ok ? 'bg-[var(--felt)]' : 'animate-soft-pulse bg-[var(--warning)]'}`}
                aria-hidden="true"
              />
              <span className="text-[var(--ink-muted)]">{status.text}</span>
            </div>
          </Card>

          {(result || game.error) && (
            <Card role="status" className="p-4">
              <p className="text-xs text-[var(--ink-muted)]">{game.error ? 'Error' : 'Hasil'}</p>
              <p className="font-display mt-1 text-lg font-medium tracking-[-0.01em]">{game.error ?? result}</p>
            </Card>
          )}

          <NotationPanel moveHistory={game.moveHistory} pgn={game.pgn} fileName={`friend-${code}`} />
        </aside>
      </main>
    </div>
  );
}

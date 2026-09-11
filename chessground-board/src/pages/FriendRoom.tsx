import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import ChessBoard from '../components/ChessBoard';
import type { Config } from '@lichess-org/chessground/config';
import type { Key } from '@lichess-org/chessground/types';
import { useChessGame } from '../hooks/useChessGame';
import { BACKEND_URL } from '../config';

type PromotionRole = 'q' | 'r' | 'b' | 'n';
type Color = 'white' | 'black';

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

export default function FriendRoom() {
  const { code = '' } = useParams<{ code: string }>();
  const game = useChessGame();
  const wsRef = useRef<WebSocket | null>(null);
  // 1 = cuma kamu, belum ada lawan. Server ngasih tau angka ini tiap
  // ada yang connect/disconnect ke room ini (lihat pesan "presence").
  const [connectedCount, setConnectedCount] = useState(1);

  // Diisi FriendLobby.tsx pas create ('white') atau join ('black'), lewat
  // sessionStorage biar reload tab yang sama masih inget - tapi kalau
  // buka link room langsung tanpa lewat lobby (device baru, dsb), ini
  // gak ada isinya. Default ke 'black' untuk kasus itu: yang paling
  // umum adalah kamu diundang (join), bukan yang bikin room.
  const myColor = useMemo<Color>(
    () => (sessionStorage.getItem(`role:${code}`) as Color | null) ?? 'black',
    [code],
  );

  // Id acak sekali per koneksi - dipakai buat nyaring gema pesan sendiri
  // (broadcast di server ngirim ke SEMUA koneksi di room, termasuk yang
  // ngirim). Tanpa ini, gerakan sendiri bakal ke-apply dua kali.
  const clientId = useMemo(() => crypto.randomUUID(), []);

  useEffect(() => {
    const wsUrl = `${BACKEND_URL.replace(/^http/, 'ws')}/ws/${code}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return; // bukan JSON valid, abaikan
      }
      if (msg.type === 'presence') {
        setConnectedCount(msg.count);
        return;
      }
      if (msg.senderId === clientId) return; // gema pesan sendiri
      if (msg.type === 'move') {
        game.tryMove(msg.orig as Key, msg.dest as Key, msg.promotion ?? undefined);
      }
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, clientId]);

  const handleAfterMove = useCallback(
    (orig: Key, dest: Key) => {
      const applied = game.tryMove(orig, dest);
      if (applied) {
        const msg: MoveMessage = { type: 'move', orig, dest, promotion: null, senderId: clientId };
        wsRef.current?.send(JSON.stringify(msg));
      }
    },
    [game.tryMove, clientId],
  );

  // Beda dari Local Pass & Play: di situ `movable.color` ngikutin giliran
  // (satu device gantian). Di sini `movable.color` DIKUNCI ke warna kamu
  // sendiri sepanjang game - kamu emang gak boleh megang bidak lawan.
  // Giliran lawan otomatis kekunci juga karena `dests` bakal kosong buat
  // warna kamu selama bukan giliranmu (dari rules engine yang sama).
  const config: Config = {
    ...(game.boardFen !== undefined ? { fen: game.boardFen } : {}),
    ...(game.turn !== undefined ? { turnColor: game.turn } : {}),
    orientation: myColor,
    check: game.check,
    lastMove: game.lastMove,
    movable: {
      free: false,
      dests: game.dests,
      color: myColor,
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

  return (
    <div className="min-h-screen bg-bg-base">
      <header className="flex items-center px-6 py-5 sm:px-10">
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-full border border-border bg-bg-raised px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition hover:border-accent-dim active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Home
        </Link>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 pb-16 lg:flex-row lg:items-start lg:justify-center">
        <div className="mx-auto w-full max-w-[560px] shrink-0 rounded-sm shadow-2xl ring-1 ring-black/40">
          <div className="aspect-square w-full">
            <ChessBoard config={config} />
          </div>
        </div>

        <aside className="flex w-full flex-col gap-4 lg:w-64">
          <div className="glass-panel rounded-2xl px-5 py-4">
            <p className="text-xs text-text-secondary">Kode room</p>
            <p className="font-mono text-lg font-semibold tracking-widest text-text-primary">{code}</p>
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${myColor === 'white' ? 'bg-white ring-1 ring-border' : 'bg-hero-to'}`}
                aria-hidden="true"
              />
              <span className="text-sm text-text-primary">
                Kamu: {myColor === 'white' ? 'Putih' : 'Hitam'}
                {game.ready && connectedCount > 1 && game.turn === myColor && ' (giliranmu)'}
              </span>
            </div>
            {connectedCount < 2 ? (
              <p className="mt-2 text-sm text-peach">Menunggu lawan join... bagikan kode room-nya.</p>
            ) : (
              resultText && <p className="mt-2 text-sm font-medium text-accent">{resultText}</p>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}

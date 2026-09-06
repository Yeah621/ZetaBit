import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BACKEND_URL } from '../config';

interface RoomResponse {
  code: string;
}

export default function FriendLobby() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/rooms`, { method: 'POST' });
      if (!res.ok) throw new Error('gagal bikin room');
      const room = (await res.json()) as RoomResponse;
      sessionStorage.setItem(`role:${room.code}`, 'white');
      navigate(`/friend/${room.code}`);
    } catch {
      setError('Gagal terhubung ke server. Pastikan backend-nya nyala (cargo run).');
    } finally {
      setBusy(false);
    }
  }, [navigate]);

  const joinRoom = useCallback(async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/rooms/${code}`);
      if (res.status === 404) {
        setError('Kode room gak ketemu. Cek lagi kodenya.');
        return;
      }
      if (!res.ok) throw new Error('gagal cari room');
      sessionStorage.setItem(`role:${code}`, 'black');
      navigate(`/friend/${code}`);
    } catch {
      setError('Gagal terhubung ke server. Pastikan backend-nya nyala (cargo run).');
    } finally {
      setBusy(false);
    }
  }, [joinCode, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg-base px-6">
      <Link to="/" className="fixed left-6 top-5 flex items-center gap-1.5 rounded-full border border-border bg-bg-raised px-4 py-2 text-sm font-medium text-text-primary shadow-sm transition hover:border-accent-dim">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Home
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="font-heading text-center text-2xl font-bold text-text-primary">Play with Friend</h1>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Buat room baru dan kirim kodenya ke teman, atau masukkan kode yang udah kamu punya.
        </p>

        <button
          onClick={createRoom}
          disabled={busy}
          className="btn-gold mt-8 w-full rounded-xl px-6 py-3 text-sm font-heading font-semibold disabled:opacity-60"
        >
          {busy ? 'Memproses...' : 'Buat Room Baru'}
        </button>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-secondary">ATAU</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
            placeholder="Kode room"
            maxLength={6}
            className="w-full rounded-xl border border-border bg-bg-raised px-4 py-3 text-center font-mono uppercase tracking-widest text-text-primary outline-none focus:border-accent-dim"
          />
          <button
            onClick={joinRoom}
            disabled={busy || !joinCode.trim()}
            className="shrink-0 rounded-xl border border-border bg-bg-raised px-5 py-3 text-sm font-semibold text-text-primary transition hover:border-accent-dim disabled:opacity-60"
          >
            Gabung
          </button>
        </div>

        {error && <p className="mt-4 text-center text-sm text-peach">{error}</p>}
      </div>
    </div>
  );
}

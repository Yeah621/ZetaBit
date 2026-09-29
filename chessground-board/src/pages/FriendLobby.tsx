import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { AppHeader } from '../components/app-header';
import { ThemeToggle } from '../components/theme-toggle';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { BACKEND_URL } from '../config';

type Status = 'idle' | 'working';

export default function FriendLobby() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  // ASUMSI yang belum terverifikasi ke backend asli: POST /rooms mengembalikan JSON
  // berbentuk { code: string }. Bentuk pasti responsnya gak ada di file yang aku terima -
  // kalau field-nya beda (mis. "roomCode" atau "id"), tinggal ganti "room.code" di bawah.
  const createRoom = async () => {
    setStatus('working');
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/rooms`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const room: { code: string } = await res.json();
      sessionStorage.setItem(`role:${room.code}`, 'white');
      navigate(`/friend/${room.code}`);
    } catch {
      setError('Gagal membuat room. Coba lagi.');
      setStatus('idle');
    }
  };

  const joinRoom = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setStatus('working');
    setError(null);
    try {
      // Dicek dulu ke GET /rooms/:code (dipakai juga oleh FriendRoom buat resync) supaya
      // kode yang salah ketik ketahuan di sini, bukan di room yang gagal konek.
      const res = await fetch(`${BACKEND_URL}/rooms/${code}`);
      if (!res.ok) throw new Error();
      sessionStorage.setItem(`role:${code}`, 'black');
      navigate(`/friend/${code}`);
    } catch {
      setError('Room tidak ditemukan. Cek lagi kodenya.');
      setStatus('idle');
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col gap-6 px-4 py-5 sm:px-6">
      <AppHeader
        subtitle="Main dengan teman"
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

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="font-display text-lg font-medium tracking-[-0.01em]">Buat room baru</h2>
        <p className="text-sm text-[var(--ink-muted)]">Kamu main sebagai Putih. Bagikan kodenya ke teman.</p>
        <Button onClick={createRoom} disabled={status === 'working'} className="self-start">
          {status === 'working' && <Loader2 className="size-4 animate-spin" />}
          Buat room
        </Button>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h2 className="font-display text-lg font-medium tracking-[-0.01em]">Gabung pakai kode</h2>
        <p className="text-sm text-[var(--ink-muted)]">Kamu main sebagai Hitam.</p>
        <div className="flex gap-2">
          <Input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Kode room"
            className="font-mono uppercase tracking-[0.2em]"
            maxLength={8}
          />
          <Button onClick={joinRoom} disabled={status === 'working' || !joinCode.trim()}>
            Gabung
          </Button>
        </div>
      </Card>

      {error && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
    </div>
  );
}

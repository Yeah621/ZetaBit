import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface Props {
  moveHistory: string[];
  pgn: string;
  /** Nama file tanpa ekstensi, mis. "pass-and-play" atau "friend-ABCD". */
  fileName?: string;
}

function triggerDownload(pgn: string, fileName: string) {
  const blob = new Blob([pgn], { type: 'application/x-chess-pgn' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.pgn`;
  document.body.appendChild(a); // Firefox lama butuh anchor ada di DOM
  a.click();
  a.remove();
  // Jangan di-revoke sinkron: sebagian browser (Safari/Firefox) baru mulai mengunduh setelah click selesai.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Notasi dua-kolom (nomor | putih | hitam) ala Lichess/Chess.com + tombol download .pgn.
// `moveHistory`/`pgn` datang dari useChessGame - lihat catatan di sana soal kapan notasi
// bisa "kosong ulang" (resync WebSocket di FriendRoom setelah reconnect).
export function NotationPanel({ moveHistory, pgn, fileName = 'game' }: Props) {
  const rows: Array<[number, string, string | undefined]> = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    rows.push([i / 2 + 1, moveHistory[i], moveHistory[i + 1]]);
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <p className="text-xs text-[var(--ink-muted)]">Notasi</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => triggerDownload(pgn, fileName)}
          disabled={moveHistory.length === 0}
        >
          <Download className="size-3.5" />
          PGN
        </Button>
      </div>
      <div className="max-h-48 overflow-y-auto border-t border-[var(--border)] px-4 py-3">
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">Belum ada langkah.</p>
        ) : (
          <ol className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1 font-mono text-sm">
            {rows.map(([n, white, black]) => (
              <li key={n} className="contents">
                <span className="text-[var(--ink-faint)]">{n}.</span>
                <span>{white}</span>
                <span>{black ?? ''}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}

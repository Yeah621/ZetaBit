import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Chessground } from '@lichess-org/chessground';
import type { Config } from '@lichess-org/chessground/config';
// Ganti baris di bawah buat pakai piece set lain (lihat README bagian "Mengganti piece set").
import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';

// `Api` gak di-export dari entry utama package (TS2459) - diturunkan dari return type Chessground().
type Api = ReturnType<typeof Chessground>;

export interface ChessBoardHandle {
  toggleOrientation: () => void;
  getApi: () => Api | null;
}

interface Props {
  config?: Config;
}

// Wrapper tipis & imperative: Chessground kelola DOM papannya sendiri (bukan lewat React
// render), jadi ini cuma mount sekali lalu bicara ke instance-nya lewat `.set()`.
const ChessBoard = forwardRef<ChessBoardHandle, Props>(function ChessBoard({ config }, ref) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    apiRef.current = Chessground(wrapRef.current, { coordinates: true, ...config });
    return () => {
      apiRef.current?.destroy();
      apiRef.current = null;
    };
    // Sengaja cuma jalan sekali di mount - update berikutnya lewat effect di bawah (.set()),
    // bukan remount, biar animasi & state internal Chessground gak kereset tiap render React.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (config) apiRef.current?.set(config);
  }, [config]);

  useImperativeHandle(ref, () => ({
    toggleOrientation: () => apiRef.current?.toggleOrientation(),
    getApi: () => apiRef.current,
  }));

  return <div ref={wrapRef} className="cg-wrap h-full w-full" />;
});

export default ChessBoard;

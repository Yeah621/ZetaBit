import { Link } from 'react-router';
import { ArrowRight, Bot, Globe, Users } from 'lucide-react';
import type { Config } from '@lichess-org/chessground/config';
import ChessBoard from '../components/ChessBoard';
import BentoCard from '../components/BentoCard';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';

const preview: Config = {
  fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R',
  lastMove: ['g8', 'f6'],
  viewOnly: true,
};

export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col gap-10 px-4 py-5 sm:px-6 lg:px-10">
      <Navbar />

      <section className="grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,460px)]">
        <div className="flex flex-col items-start gap-5">
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
            Gratis · Tanpa perlu akun
          </span>
          <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
            Main catur langsung di browser.
          </h1>
          <p className="max-w-[46ch] text-base text-[var(--ink-muted)]">
            Satu layar berdua, atau kirim link room ke teman di device lain. Aturan dan sinkronisasi jalan real-time.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/local">
                Main sekarang <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/friend">Main dengan teman</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[460px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.35)]">
          <div className="aspect-square w-full">
            <ChessBoard config={preview} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <BentoCard to="/local" icon={<Users />} title="Pass & Play" description="Dua pemain, satu layar. Giliran ganti otomatis." />
        <BentoCard to="/friend" icon={<Globe />} title="Main dengan teman" description="Buat room, bagikan kode, main real-time dari device berbeda." />
        <BentoCard soon icon={<Bot />} title="Lawan AI" description="Latihan lawan bot dengan level yang bisa diatur." />
      </section>
    </div>
  );
}

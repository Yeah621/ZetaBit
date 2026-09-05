import ChessBoard from '../components/ChessBoard';
import Navbar from '../components/Navbar';
import BentoCard from '../components/BentoCard';
import { Link } from 'react-router';

// Ruy Lopez after 3.Bb5 - a real, recognizable opening in progress rather
// than the static starting array, so the hero reads as "a game is
// happening here" instead of decoration for its own sake.
const HERO_FEN = 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R';

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="hero-band">
        <Navbar />

        <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 px-6 pb-16 pt-6 sm:pt-10 lg:flex-row lg:items-center lg:gap-16 lg:pb-24">
          <div className="text-center lg:flex-1 lg:text-left">
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-text-on-dark sm:text-5xl">
              Asah Taktik
              <br />
              <span className="text-accent">Kuasai Papan</span>
              <br />
              Menangkan Setiap Langkah
            </h1>
            <p className="mx-auto mt-5 max-w-md text-text-on-dark-secondary lg:mx-0">
              Main sendirian di satu layar, lawan teman, atau lawan komputer. Pilih mode yang kamu mau di
              bawah.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
              <Link
                to="/local"
                className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-hero-to transition active:scale-95"
              >
                Main Sekarang
              </Link>
              <a
                href="#modes"
                className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-text-on-dark transition active:scale-95"
              >
                Lihat Mode Lain
              </a>
            </div>
          </div>

          <div className="relative w-48 shrink-0 sm:w-56">
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 scale-150 rounded-full bg-lavender/25 blur-3xl"
            />
            <span className="floating-badge absolute -left-6 -top-4 z-10 rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary sm:-left-10">
              Ruy Lopez
            </span>
            <ChessBoard
              config={{
                fen: HERO_FEN,
                viewOnly: true,
                coordinates: false,
                movable: { free: false, dests: new Map() },
                draggable: { enabled: false },
                selectable: { enabled: false },
                animation: { enabled: false },
              }}
            />
            <span className="floating-badge absolute -bottom-4 -right-6 z-10 rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary sm:-right-10">
              Main tanpa akun
            </span>
          </div>
        </div>
      </div>

      <main id="modes" className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:grid-rows-2">
          <div className="sm:row-span-2">
            <BentoCard
              large
              to="/local"
              accent="lavender"
              title="Local Pass & Play"
              description="Main gantian di satu perangkat yang sama, tanpa koneksi apa pun."
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              }
            />
          </div>

          <BentoCard
            comingSoon
            accent="peach"
            title="Play with Friend"
            description="Undang teman lewat kode room dan main real-time."
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                <circle cx="8" cy="12" r="5" />
                <circle cx="16" cy="12" r="5" />
              </svg>
            }
          />

          <BentoCard
            comingSoon
            accent="mint"
            title="Play with AI"
            description="Latih strategi lawan bot dengan level yang bisa diatur."
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 2 14 9 21 12 14 15 12 22 10 15 3 12 10 9Z" />
              </svg>
            }
          />
        </div>
      </main>
    </div>
  );
}

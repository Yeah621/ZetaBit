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

        {/* Decorative blurred glow circles - depth beyond one flat
            gradient, same trick as the reference's hero. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 h-80 w-80 -translate-y-1/4 translate-x-1/4 rounded-full bg-accent/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-96 w-96 -translate-x-1/4 translate-y-1/4 rounded-full bg-lavender/10 blur-3xl"
        />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 pb-20 pt-10 sm:pt-14 lg:flex-row lg:items-center lg:gap-10 lg:pb-28">
          <div className="text-center lg:flex-1 lg:text-left">
            <div className="mb-5 flex items-center justify-center gap-3 lg:justify-start">
              <span className="h-px w-8 bg-accent/50" />
              <span className="text-xs font-medium tracking-[0.2em] text-accent">ZETABIT CHESS</span>
              <span className="h-px w-8 bg-accent/50" />
            </div>

            <h1 className="font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-text-on-dark sm:text-5xl lg:text-6xl">
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
                className="btn-gold flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-heading font-semibold"
              >
                Main Sekarang
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <a
                href="#modes"
                className="btn-outline flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-heading font-semibold"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
                Lihat Mode Lain
              </a>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-5 lg:justify-start">
              {['3 Mode Permainan', 'Gratis', 'Tanpa Perlu Akun'].map((item, i) => (
                <span key={item} className="flex items-center gap-5">
                  {i > 0 && <span className="hidden h-8 w-px bg-white/15 sm:block" />}
                  <span className="text-sm font-medium text-text-on-dark-secondary">{item}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="w-full max-w-xs shrink-0 sm:max-w-sm lg:w-[26rem] lg:max-w-none">
            <div className="relative rotate-2 rounded-3xl bg-linear-to-br from-white/10 to-white/0 p-3 shadow-2xl ring-1 ring-white/10 transition-transform duration-500 hover:rotate-0 sm:p-4">
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 rounded-3xl bg-lavender/25 blur-3xl"
              />
              <span className="floating-badge absolute -left-5 -top-4 z-10 rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary sm:-left-8">
                Ruy Lopez
              </span>
              <div className="aspect-square overflow-hidden rounded-2xl">
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
              </div>
              <span className="floating-badge absolute -bottom-4 -right-5 z-10 rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary sm:-right-8">
                Main tanpa akun
              </span>
            </div>
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

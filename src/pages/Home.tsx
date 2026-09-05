import ChessBoard from '../components/ChessBoard';
import Navbar from '../components/Navbar';
import BentoCard from '../components/BentoCard';

// Ruy Lopez after 3.Bb5 - a real, recognizable opening in progress rather
// than the static starting array, so the hero reads as "a game is
// happening here" instead of decoration for its own sake.
const HERO_FEN = 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R';

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-base">
      <Navbar />

      <main className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-6 text-center sm:pt-10">
        <div className="relative w-40 sm:w-48">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 scale-150 rounded-full bg-lavender/20 blur-3xl"
          />
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

        <h1 className="mt-8 max-w-xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          Catur, dengan cara apa pun kamu mau main
        </h1>
        <p className="mt-3 max-w-md text-text-secondary">
          Sendirian di satu layar, lawan teman, atau lawan komputer. Pilih mode di bawah.
        </p>

        <div className="mt-10 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-2 sm:grid-rows-2">
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

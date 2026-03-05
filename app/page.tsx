import { BasketballGame } from '@/components/game/basketball-game';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.6) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.6) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.5) 0%, transparent 70%)' }}
        />
      </div>

      <div className="max-w-4xl w-full space-y-5 relative z-10">
        {/* Game Container */}
        <div className="flex justify-center">
          <BasketballGame />
        </div>

        {/* Footer */}
        <footer className="text-center text-xs tracking-widest uppercase" style={{ color: 'rgba(148,163,184,0.4)' }}>
          Basketball Time &nbsp;·&nbsp; Sportech Edition
        </footer>
      </div>
    </main>
  );
}

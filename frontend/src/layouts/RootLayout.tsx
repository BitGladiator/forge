import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#090a0f] text-zinc-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-800/60 bg-zinc-950/40 py-6 text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-400">Forge</span>
            <span>—</span>
            <span>Build. Submit. Judge.</span>
          </div>
          <div>
            <span>DOGFOOD 2026 Hackathon Platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

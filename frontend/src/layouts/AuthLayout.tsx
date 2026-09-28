import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Terminal } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-[#090a0f] text-zinc-100">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-100 hover:text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-zinc-200">
              <Terminal className="h-5 w-5 stroke-[2]" />
            </div>
            <span className="font-mono text-xl font-bold tracking-tight">Forge</span>
          </Link>
          <p className="text-xs text-zinc-400 font-mono">Build. Submit. Judge.</p>
        </div>

        <Outlet />

        <div className="text-center">
          <Link to="/projects" className="text-xs text-zinc-500 hover:text-zinc-300 font-mono transition-colors">
            Browse public projects without signing in →
          </Link>
        </div>
      </div>
    </div>
  );
};

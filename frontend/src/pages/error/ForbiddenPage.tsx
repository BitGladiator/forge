import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';

interface ForbiddenPageProps {
  requiredRole?: string;
  currentRole?: string;
}

export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({ requiredRole, currentRole }) => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-950/30 border border-rose-900/50 text-rose-400 mb-4">
        <ShieldAlert className="h-6 w-6 stroke-[1.5]" />
      </div>

      <span className="font-mono text-xs uppercase tracking-widest text-rose-500 mb-2">
        Error 403
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mb-2">
        Access Denied
      </h1>
      <p className="max-w-md text-sm text-zinc-400 leading-relaxed mb-6">
        The current account does not have permission to access the requested resource.
        {currentRole && requiredRole && (
          <span className="block mt-2 font-mono text-xs text-zinc-500">
            Current role: <strong className="text-zinc-300">{currentRole}</strong> (Requires: {requiredRole})
          </span>
        )}
      </p>

      <div className="flex items-center gap-3">
        <Link to="/projects">
          <Button variant="primary" size="md">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Return to Projects Gallery</span>
          </Button>
        </Link>
        <Link to="/">
          <Button variant="outline" size="md">
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

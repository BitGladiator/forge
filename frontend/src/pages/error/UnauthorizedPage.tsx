import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 mb-4">
        <Lock className="h-6 w-6 stroke-[1.5]" />
      </div>

      <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-2">
        Error 401
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mb-2">
        Authentication Required
      </h1>
      <p className="max-w-md text-sm text-zinc-400 leading-relaxed mb-6">
        You must be signed in with a valid account session to access this page. Please log in or
        register to continue.
      </p>

      <div className="flex items-center gap-3">
        <Link to="/login">
          <Button variant="primary" size="md">
            <span>Log In to Forge</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <Link to="/projects">
          <Button variant="outline" size="md">
            Browse Public Projects
          </Button>
        </Link>
      </div>
    </div>
  );
};

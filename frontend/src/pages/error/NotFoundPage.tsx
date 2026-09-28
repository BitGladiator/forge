import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 mb-4">
        <FileQuestion className="h-6 w-6 stroke-[1.5]" />
      </div>

      <span className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-2">
        Error 404
      </span>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 mb-2">
        Page Not Found
      </h1>
      <p className="max-w-md text-sm text-zinc-400 leading-relaxed mb-6">
        The route or resource you are trying to access does not exist or may have been relocated.
      </p>

      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="primary" size="md">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Go to Forge Home</span>
          </Button>
        </Link>
        <Link to="/projects">
          <Button variant="outline" size="md">
            Browse Projects
          </Button>
        </Link>
      </div>
    </div>
  );
};

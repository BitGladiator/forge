import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Lock, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const redirectByRole = (role: UserRole) => {
    switch (role) {
      case 'participant':
        navigate('/dashboard');
        break;
      case 'judge':
        navigate('/judge');
        break;
      case 'organizer':
        navigate('/organizer');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/projects');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const authenticatedUser = await login({ email, password });
      redirectByRole(authenticatedUser.role);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('forge2026');
    setErrorMessage(null);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-200">
            <Lock className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-100">Sign in to Forge</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Authenticate to access your role-specific dashboard
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-rose-900/60 bg-rose-950/30 p-2.5 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            autoComplete="email"
            placeholder="developer@forge.internal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        {/* Demo Credentials Quick-Fill for convenience */}
        <div className="mt-6 pt-5 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2.5">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" />
            <span>Pre-Configured Accounts</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-left">
            <button
              type="button"
              onClick={() => handleFillDemo('participant@forge.internal')}
              className="rounded border border-zinc-800 bg-zinc-950/50 p-1.5 text-[11px] hover:border-zinc-700 transition-colors"
            >
              <div className="font-semibold text-emerald-400">Participant</div>
              <div className="text-zinc-500 truncate text-[10px]">participant@forge.internal</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('judge_a@forge.internal')}
              className="rounded border border-zinc-800 bg-zinc-950/50 p-1.5 text-[11px] hover:border-zinc-700 transition-colors"
            >
              <div className="font-semibold text-sky-400">Judge</div>
              <div className="text-zinc-500 truncate text-[10px]">judge_a@forge.internal</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('organizer@forge.internal')}
              className="rounded border border-zinc-800 bg-zinc-950/50 p-1.5 text-[11px] hover:border-zinc-700 transition-colors"
            >
              <div className="font-semibold text-amber-400">Organizer</div>
              <div className="text-zinc-500 truncate text-[10px]">organizer@forge.internal</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('admin@forge.internal')}
              className="rounded border border-zinc-800 bg-zinc-950/50 p-1.5 text-[11px] hover:border-zinc-700 transition-colors"
            >
              <div className="font-semibold text-rose-400">Admin</div>
              <div className="text-zinc-500 truncate text-[10px]">admin@forge.internal</div>
            </button>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-zinc-800/80 text-center">
          <p className="text-xs text-zinc-400">
            New participant?{' '}
            <Link to="/register" className="text-zinc-200 underline hover:text-white font-medium">
              Create participant account
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

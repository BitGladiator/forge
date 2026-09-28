import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Terminal, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';

export const Navbar: React.FC = () => {
  const { role, user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Generate navigation links based on current authenticated role
  const getNavLinks = () => {
    switch (role) {
      case 'participant':
        return [
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Projects', path: '/projects' },
          { label: 'Team', path: '/team' },
          { label: 'Submission', path: '/submission' },
        ];
      case 'judge':
        return [
          { label: 'Projects', path: '/projects' },
          { label: 'Judge Dashboard', path: '/judge' },
        ];
      case 'organizer':
        return [
          { label: 'My Hackathons', path: '/organizer' },
          { label: 'Projects', path: '/projects' },
        ];
      case 'admin':
        return [
          { label: 'Admin Console', path: '/admin' },
          { label: 'My Hackathons', path: '/organizer' },
          { label: 'Projects', path: '/projects' },
        ];
      case 'visitor':
      default:
        return [
          { label: 'Projects', path: '/projects' },
        ];
    }
  };

  const navLinks = getNavLinks();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const getRoleBadgeVariant = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return 'danger';
      case 'organizer':
        return 'warning';
      case 'judge':
        return 'info';
      case 'participant':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-zinc-100 hover:text-white transition-colors">
            <div className="flex h-7 w-7 items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-zinc-200">
              <Terminal className="h-4 w-4 stroke-[2]" />
            </div>
            <span className="font-mono text-base font-bold tracking-tight">Forge</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-zinc-800/80 text-zinc-100 font-semibold'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right side controls: Authenticated User Info or Login/Register */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Badge
                variant={getRoleBadgeVariant(role) as any}
                size="sm"
                className="uppercase font-mono text-[10px] tracking-wider font-semibold"
              >
                {role}
              </Badge>
              <div className="text-right border-l border-zinc-800/80 pl-3">
                <p className="text-xs font-medium text-zinc-200 leading-none">{user.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{user.email}</p>
              </div>
              <button
                onClick={() => logout()}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-900 transition-colors"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-zinc-100 text-zinc-900 px-3 py-1.5 text-xs font-medium hover:bg-white transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated && (
            <Badge variant={getRoleBadgeVariant(role) as any} size="sm" className="uppercase font-mono text-[10px]">
              {role}
            </Badge>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-zinc-400 hover:text-zinc-200"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3 md:hidden space-y-2 text-left">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm ${
                isActive(link.path)
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-zinc-800">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="px-2 py-1">
                  <p className="text-xs font-medium text-zinc-200">{user.name}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center rounded-md border border-zinc-800 bg-zinc-900 py-2 text-xs font-medium text-zinc-300"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center rounded-md bg-zinc-100 text-zinc-900 py-2 text-xs font-medium font-semibold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

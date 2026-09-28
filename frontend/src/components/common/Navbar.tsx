import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Terminal, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';
import type { UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const { role, user, isAuthenticated, logout, switchRole } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  // Generate navigation links based on current role
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
  const availableRoles: UserRole[] = ['visitor', 'participant', 'judge', 'organizer', 'admin'];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
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

        {/* Right side controls: Role Switcher & Auth */}
        <div className="hidden md:flex items-center gap-3">
          {/* Dev Role Quick Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900/90 px-2 py-1 text-[11px] font-mono text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
              title="Test role access levels"
            >
              <span className="text-zinc-500">Role:</span>
              <span className="font-semibold text-zinc-200 uppercase">{role}</span>
              <ChevronDown className="h-3 w-3 text-zinc-500" />
            </button>

            {roleDropdownOpen && (
              <div
                className="absolute right-0 mt-1 w-36 rounded-md border border-zinc-800 bg-zinc-900 p-1 shadow-lg z-50 text-left"
                onMouseLeave={() => setRoleDropdownOpen(false)}
              >
                <div className="px-2 py-1 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  Switch Active Role
                </div>
                {availableRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                      role === r
                        ? 'bg-zinc-800 text-zinc-100 font-semibold'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    }`}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Authentication State */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
              <div className="text-right">
                <p className="text-xs font-medium text-zinc-200 leading-none">{user?.name}</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{user?.email}</p>
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
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Badge variant="neutral" size="sm" className="uppercase text-[10px]">
            {role}
          </Badge>
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
            <p className="text-[11px] font-mono text-zinc-500 mb-1.5 uppercase">Switch Role</p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {availableRoles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2 py-1 text-xs rounded border ${
                    role === r
                      ? 'border-blue-500 bg-blue-950/40 text-blue-300 font-medium'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900 py-2 text-xs font-medium text-zinc-300"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log out</span>
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center rounded-md border border-zinc-700 bg-zinc-900 py-2 text-xs font-medium text-zinc-200"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

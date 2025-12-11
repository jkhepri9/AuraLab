import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Layers,
  Activity,
  SlidersHorizontal,
  Music,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'AuraGenerator', path: '/AuraGenerator', icon: Activity },
  { name: 'AuraConverter', path: '/AuraConverter', icon: Music },
  { name: 'AuraModes', path: '/AuraModes', icon: Layers },
  { name: 'AuraStudio', path: '/AuraEditor', icon: SlidersHorizontal },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [drawerSide, setDrawerSide] = useState('right'); // 'left' or 'right'

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isActive = (item) => {
    if (item.path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(item.path);
  };

  const handleToggleMenu = (event) => {
    try {
      const clickX = event?.nativeEvent?.clientX ?? window.innerWidth;
      const side = clickX < window.innerWidth / 2 ? 'left' : 'right';
      setDrawerSide(side);
    } catch {
      setDrawerSide('right');
    }
    setMobileMenuOpen((prev) => !prev);
  };

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo/Title */}
        <Link
          to="/"
          className="text-xl font-extrabold tracking-widest text-white hover:text-gray-300 transition-colors z-50"
        >
          AURA<span className="text-emerald-400">LAB</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center text-sm font-medium transition-all ${
                  active
                    ? 'text-white border-b-2 border-emerald-400 pb-1'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4 mr-1" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={handleToggleMenu}
          className="md:hidden text-white hover:text-emerald-400 transition-colors z-50"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer + Overlay (Hybrid premium style, NO overflow) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Dark blurred overlay */}
          <button
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeMobileMenu}
            aria-label="Close menu overlay"
          />

          {/* Drawer container (side depends on thumb position) */}
          <div
            className={`absolute inset-y-0 flex max-w-full pointer-events-none ${
              drawerSide === 'left' ? 'left-0 justify-start' : 'right-0 justify-end'
            }`}
          >
            {/* Actual drawer */}
            <nav
              className="
                pointer-events-auto h-full w-[78vw] max-w-xs
                bg-zinc-950/95 backdrop-blur-2xl
                border-l border-white/10 shadow-2xl
                flex flex-col
                transform transition-transform duration-300 ease-[cubic-bezier(0.22,0.61,0.36,1)]
                translate-x-0
              "
            >
              {/* Header inside drawer */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/10">
                <span className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase">
                  Navigation
                </span>
                <button
                  onClick={closeMobileMenu}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu items */}
              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
                {navItems.map((item) => {
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={`
                        flex items-center px-4 py-3 rounded-2xl text-base font-medium
                        transition-all duration-200
                        ${
                          active
                            ? 'bg-emerald-500/20 text-white border border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                            : 'text-gray-300 hover:text-white hover:bg-white/5 border border-transparent'
                        }
                      `}
                    >
                      <div
                        className={`
                          mr-3 flex h-9 w-9 items-center justify-center rounded-xl
                          ${
                            active
                              ? 'bg-emerald-500/30 text-emerald-100'
                              : 'bg-zinc-800 text-gray-300'
                          }
                        `}
                      >
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Bottom subtle branding bar */}
              <div className="px-6 py-4 border-t border-white/10 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>AuraLab · Frequency Studio</span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-gray-500">
                    v1.0
                  </span>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

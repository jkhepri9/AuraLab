import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Download, Menu, X } from 'lucide-react';
import usePWAInstall from '../hooks/usePWAInstall';

const navItems = [
  { name: 'Home', path: '/' },
  { name: 'AuraGenerator', path: '/AuraGenerator' },
  { name: 'AuraConverter', path: '/AuraConverter' },
  { name: 'AuraModes', path: '/AuraModes' },
  { name: 'AuraStudio', path: '/AuraEditor' },

  // ✅ NEW: Account (visible in desktop nav + hamburger)
  { name: 'Account', path: '/account' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { canShowInstall, isInstallable, promptInstall } = usePWAInstall();
  const isHome = location.pathname === '/';

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const toggleMobileMenu = () => setMobileMenuOpen((v) => !v);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Close drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Scroll-lock behind drawer
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileMenuOpen]);

  // ESC closes drawer
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeMobileMenu();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const mobileDrawer = mobileMenuOpen
    ? createPortal(
        <div className="fixed inset-0 z-[9999] md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMobileMenu}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer panel */}
          <div
            className="
              fixed right-0 top-0 h-full
              w-[82vw] max-w-xs
              bg-zinc-950 text-white
              border-l border-white/10
              shadow-2xl
              overflow-y-auto
            "
          >
            {/* Top row (brand + close) */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
              <span className="text-sm font-extrabold tracking-widest">
                AURA<span className="text-emerald-400">LAB</span>
              </span>

              <button
                type="button"
                onClick={closeMobileMenu}
                aria-label="Close menu"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-3 py-3 space-y-2">
              {/* Install CTA at top of hamburger */}
              {canShowInstall && (
                <button
                  type="button"
                  onClick={async () => {
                    if (isInstallable) {
                      await promptInstall();
                      closeMobileMenu();
                    } else {
                      closeMobileMenu();
                      navigate('/Install');
                    }
                  }}
                  className="
                    w-full rounded-2xl px-4 py-4
                    bg-emerald-500 text-black
                    font-extrabold text-base
                    flex items-center justify-center gap-2
                    shadow-lg shadow-emerald-500/20
                    active:scale-[0.99]
                  "
                >
                  <Download className="w-5 h-5" /> Install App
                </button>
              )}

              {/* Links */}
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={
                      `
                        block rounded-2xl px-4 py-4
                        text-base font-semibold
                        transition-all
                      ` +
                      (active
                        ? 'bg-emerald-500/20 border border-emerald-500/50 text-white'
                        : 'bg-white/0 border border-transparent text-gray-200 hover:bg-white/5 hover:text-white')
                    }
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-extrabold tracking-widest text-white hover:text-gray-300 transition-colors"
          >
            AURA<span className="text-emerald-400">LAB</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Primary">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={
                    `text-sm font-medium transition-all ` +
                    (active
                      ? 'text-white border-b-2 border-emerald-400 pb-1'
                      : 'text-gray-400 hover:text-white')
                  }
                >
                  {item.name}
                </Link>
              );
            })}

            {/* Top-right Install button */}
            {isHome && canShowInstall && (
              <button
                type="button"
                onClick={async () => {
                  if (isInstallable) {
                    await promptInstall();
                  } else {
                    navigate('/Install');
                  }
                }}
                className="
                  ml-2 inline-flex items-center gap-2
                  px-3 py-2 rounded-2xl
                  bg-white/10 hover:bg-white/15
                  border border-white/10
                  text-white text-sm font-bold
                  transition-all
                "
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Install
              </button>
            )}
          </nav>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile install button (visible on Home only) */}
            {isHome && canShowInstall && (
              <button
                type="button"
                onClick={async () => {
                  if (isInstallable) {
                    await promptInstall();
                  } else {
                    navigate('/Install');
                  }
                }}
                aria-label="Install AuraLab"
                className="
                  inline-flex items-center justify-center
                  w-10 h-10 rounded-2xl
                  bg-white/10 hover:bg-white/15
                  border border-white/10
                  text-white
                  transition-all
                "
              >
                <Download className="w-5 h-5 text-emerald-400" />
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="text-white hover:text-emerald-400 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {mobileDrawer}
    </>
  );
}

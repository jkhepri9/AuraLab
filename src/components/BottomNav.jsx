import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, Activity, SlidersHorizontal, Music } from 'lucide-react';

const navItems = [
  { name: 'Home', path: '/', icon: Home },
  { name: 'AuraGenerator', path: '/AuraGenerator', icon: Activity },
  { name: 'AuraConverter', path: '/AuraConverter', icon: Music },
  { name: 'AuraModes', path: '/AuraModes', icon: Layers },
  { name: 'AuraStudio', path: '/AuraEditor', icon: SlidersHorizontal },
];

export default function BottomNav() {
  const location = useLocation();

  const isActive = (item) => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  };

  return (
    <nav
      className="
        md:hidden fixed left-0 right-0 z-30
        bottom-0
        w-screen max-w-[100vw]
        bg-zinc-950/80 backdrop-blur-xl
        border-t border-white/10
        overflow-x-hidden
      "
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <div className="mx-auto max-w-7xl px-2">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={
                  `flex flex-col items-center justify-center gap-1 rounded-2xl mx-1 my-2 transition-all ` +
                  (active
                    ? 'bg-emerald-500/15 text-white border border-emerald-500/40'
                    : 'text-gray-400 hover:text-white hover:bg-white/5')
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold tracking-wide leading-none whitespace-nowrap max-w-[72px] truncate">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

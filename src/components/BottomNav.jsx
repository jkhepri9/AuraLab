// src/components/BottomNav.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Layers, Activity, SlidersHorizontal, Music } from "lucide-react";

const navItems = [
  { name: "Home", path: "/", icon: Home },
  { name: "Tone", path: "/AuraGenerator", icon: Activity },
  { name: "Converter", path: "/AuraConverter", icon: Music },
  { name: "Modes", path: "/AuraModes", icon: Layers },
  { name: "Studio", path: "/AuraEditor", icon: SlidersHorizontal },
];

export default function BottomNav() {
  const location = useLocation();

  const isActive = (item) => {
    if (item.path === "/") return location.pathname === "/";
    return location.pathname.startsWith(item.path);
  };

  return (
    <nav
      className="
        md:hidden fixed left-0 right-0 z-30 bottom-0
        w-screen max-w-[100vw]
        bg-zinc-950/80 backdrop-blur-xl
        border-t border-white/10
        overflow-x-hidden
      "
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
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
                aria-current={active ? "page" : undefined}
                className={`
                  flex h-full flex-col items-center justify-center gap-1
                  select-none
                  transition-colors duration-150
                  focus:outline-none focus-visible:outline-none
                  active:opacity-90
                  ${active ? "text-emerald-300" : "text-zinc-400 hover:text-zinc-200"}
                `}
              >
                <Icon className="w-5 h-5" />
                <span
                  className={`
                    text-[10px] leading-none tracking-wide whitespace-nowrap
                    ${active ? "font-bold" : "font-semibold"}
                  `}
                >
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

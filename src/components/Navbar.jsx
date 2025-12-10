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

    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/10 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

                {/* Logo/Title */}
                <Link to="/" className="text-xl font-extrabold tracking-widest text-white hover:text-gray-300 transition-colors z-50">
                    AURA<span className="text-emerald-400">LAB</span>
                </Link>

                {/* Desktop Navigation Links */}
                <nav className="hidden md:flex items-center space-x-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`flex items-center text-sm font-medium transition-all ${
                                location.pathname.startsWith(item.path) && item.path !== '/'
                                    ? 'text-white border-b-2 border-emerald-400 pb-1'
                                    : location.pathname === item.path
                                    ? 'text-white border-b-2 border-emerald-400 pb-1'
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <item.icon className="w-4 h-4 mr-1" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden text-white hover:text-emerald-400 transition-colors z-50"
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Mobile Navigation Menu */}
            <nav
                className={`
                    fixed top-16 right-0 h-[calc(100vh-4rem)] w-64 bg-zinc-950/95 backdrop-blur-xl
                    border-l border-white/10 shadow-2xl transform transition-transform duration-300 ease-in-out z-40
                    md:hidden
                    ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
            >
                <div className="flex flex-col p-6 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            onClick={closeMobileMenu}
                            className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all ${
                                location.pathname.startsWith(item.path) && item.path !== '/'
                                    ? 'bg-emerald-500/20 text-white border border-emerald-500/50'
                                    : location.pathname === item.path
                                    ? 'bg-emerald-500/20 text-white border border-emerald-500/50'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <item.icon className="w-5 h-5 mr-3" />
                            {item.name}
                        </Link>
                    ))}
                </div>
            </nav>
        </header>
    );
}
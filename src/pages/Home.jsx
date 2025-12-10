import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../components/utils';
import { Activity, Music, ArrowRight, Zap, Heart, Download, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="space-y-20 py-10">
      {/* Hero Section */}
      <section className="text-center space-y-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 relative z-10">

          Where Your Aura Evolves.
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">

          An immersive frequency lab for building, healing, and evolving your inner field.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-4">

          <Link to={createPageUrl('AuraGenerator')}>
            <button className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2">
              <Activity className="w-5 h-5" /> AuraGenerator
            </button>
          </Link>
          <Link to={createPageUrl('AuraConverter')}>
            <button className="px-8 py-4 rounded-full bg-white/10 text-white font-bold text-lg hover:bg-white/20 border border-white/10 backdrop-blur-sm transition-all flex items-center gap-2">
              <Music className="w-5 h-5" /> AuraConverter
            </button>
          </Link>
        </motion.div>

          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex justify-center">

          <Link to={createPageUrl('Install')}>
            <button className="px-6 py-3 rounded-full bg-emerald-500/20 text-emerald-400 font-medium hover:bg-emerald-500/30 border border-emerald-500/30 transition-all flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> Install App
            </button>
          </Link>
          </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <Link to={createPageUrl('AuraGenerator')} className="group">
          <div className="h-full p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-white/10 hover:border-emerald-500/50 transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="w-6 h-6 -rotate-45 group-hover:rotate-0 transition-transform duration-300 text-emerald-500" />
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-emerald-400 transition-colors">AuraGenerator</h3>
            <p className="text-gray-400 mb-4">Frequency Generator capable of generating sine, square, saw, and triangle waves from 0.1Hz to 20kHz.</p>
            <div className="h-1 w-12 bg-gray-800 group-hover:w-full bg-emerald-500/50 transition-all duration-500 rounded-full"></div>
          </div>
        </Link>

        <Link to={createPageUrl('AuraConverter')} className="group">
          <div className="h-full p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-white/10 hover:border-purple-500/50 transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="w-6 h-6 -rotate-45 group-hover:rotate-0 transition-transform duration-300 text-purple-500" />
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-purple-400 transition-colors">AuraConverter</h3>
            <p className="text-gray-400 mb-4">Transform your existing audio library. Shift pitch from standard 440Hz to the natural resonance of 432Hz.</p>
            <div className="h-1 w-12 bg-gray-800 group-hover:w-full bg-purple-500/50 transition-all duration-500 rounded-full"></div>
          </div>
        </Link>

        <Link to={createPageUrl('AuraModes')} className="group md:col-span-2">
            <div className="h-full p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-black border border-white/10 hover:border-amber-500/50 transition-colors relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="w-6 h-6 -rotate-45 group-hover:rotate-0 transition-transform duration-300 text-amber-500" />
            </div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
              <Layers className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-amber-400 transition-colors">Aura Modes</h3>
            <p className="text-gray-400 mb-4 max-w-md">Explore our collection of custom frequency presets or create your own room of sound designed for your aura.</p>
            <div className="h-1 w-12 bg-gray-800 group-hover:w-full bg-amber-500/50 transition-all duration-500 rounded-full"></div>
            </div>
            </Link>
            </section>
    </div>);

}
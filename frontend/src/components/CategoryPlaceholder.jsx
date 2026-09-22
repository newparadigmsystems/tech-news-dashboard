import React from 'react';
import { Shield, Cpu, Cloud, Atom, Rocket, BookOpen, Radio, Sparkles } from 'lucide-react';

export default function CategoryPlaceholder({ category, publication }) {
  const pubInitial = publication ? publication.substring(0, 2).toUpperCase() : 'TR';

  switch (category?.toLowerCase()) {
    case 'cybersecurity':
      return (
        <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-rose-950 via-slate-950 to-red-950 flex flex-col justify-between p-4 border-r border-rose-900/30">
          {/* Background Matrix / Circuit Grid */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:16px_16px]" />
          <svg className="absolute -right-6 -bottom-6 w-36 h-36 text-rose-500/10 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" />
            <polygon points="50,20 75,35 75,65 50,80 25,65 25,35" />
            <line x1="50" y1="5" x2="50" y2="20" />
            <line x1="90" y1="25" x2="75" y2="35" />
            <line x1="90" y1="75" x2="75" y2="65" />
            <line x1="50" y1="95" x2="50" y2="80" />
            <line x1="10" y1="75" x2="25" y2="65" />
            <line x1="10" y1="25" x2="25" y2="35" />
          </svg>

          {/* Top Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              CYBER DEFENSE
            </span>
            <span className="text-[10px] font-mono text-rose-400/60">01001101</span>
          </div>

          {/* Center Graphic */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/50 mb-2">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-rose-200 tracking-wide text-center">
              Cybersecurity
            </span>
          </div>

          {/* Bottom Publication Identifier */}
          <div className="relative z-10 flex items-center justify-between text-[11px] text-rose-300/70 border-t border-rose-900/40 pt-2">
            <span className="truncate max-w-[120px] font-medium">{publication}</span>
            <span className="font-mono text-[10px] bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/40 text-rose-300">{pubInitial}</span>
          </div>
        </div>
      );

    case 'ai':
      return (
        <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-purple-950 via-slate-950 to-indigo-950 flex flex-col justify-between p-4 border-r border-purple-900/30">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:16px_16px]" />
          {/* Synapse Connection SVG */}
          <svg className="absolute -right-4 -top-4 w-36 h-36 text-purple-500/10 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2">
            <circle cx="30" cy="30" r="6" />
            <circle cx="70" cy="20" r="4" />
            <circle cx="80" cy="65" r="5" />
            <circle cx="40" cy="80" r="7" />
            <circle cx="20" cy="60" r="3" />
            <line x1="30" y1="30" x2="70" y2="20" />
            <line x1="70" y1="20" x2="80" y2="65" />
            <line x1="80" y1="65" x2="40" y2="80" />
            <line x1="40" y1="80" x2="20" y2="60" />
            <line x1="20" y1="60" x2="30" y2="30" />
            <line x1="30" y1="30" x2="80" y2="65" />
          </svg>

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              NEURAL / LLM
            </span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>

          <div className="relative z-10 my-auto flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-950/50 mb-2">
              <Cpu className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-purple-200 tracking-wide text-center">
              Artificial Intelligence
            </span>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] text-purple-300/70 border-t border-purple-900/40 pt-2">
            <span className="truncate max-w-[120px] font-medium">{publication}</span>
            <span className="font-mono text-[10px] bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800/40 text-purple-300">{pubInitial}</span>
          </div>
        </div>
      );

    case 'cloud':
      return (
        <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-sky-950 via-slate-950 to-blue-950 flex flex-col justify-between p-4 border-r border-sky-900/30">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
          <svg className="absolute -right-4 -bottom-4 w-36 h-36 text-sky-500/10 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="20" y="20" width="60" height="15" rx="3" />
            <rect x="20" y="42" width="60" height="15" rx="3" />
            <rect x="20" y="64" width="60" height="15" rx="3" />
            <circle cx="30" cy="27.5" r="2" fill="currentColor" />
            <circle cx="30" cy="49.5" r="2" fill="currentColor" />
            <circle cx="30" cy="71.5" r="2" fill="currentColor" />
          </svg>

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
              DISTRIBUTED INFRA
            </span>
            <span className="text-[10px] font-mono text-sky-400/60">AWS/GCP/CF</span>
          </div>

          <div className="relative z-10 my-auto flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-950/50 mb-2">
              <Cloud className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-sky-200 tracking-wide text-center">
              Cloud Computing
            </span>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] text-sky-300/70 border-t border-sky-900/40 pt-2">
            <span className="truncate max-w-[120px] font-medium">{publication}</span>
            <span className="font-mono text-[10px] bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800/40 text-sky-300">{pubInitial}</span>
          </div>
        </div>
      );

    case 'quantum':
      return (
        <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950 flex flex-col justify-between p-4 border-r border-emerald-900/30">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
          {/* Orbital Atom Rings */}
          <svg className="absolute -right-6 -bottom-6 w-40 h-40 text-emerald-500/10 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
            <ellipse cx="50" cy="50" rx="45" ry="18" transform="rotate(30 50 50)" />
            <ellipse cx="50" cy="50" rx="45" ry="18" transform="rotate(-30 50 50)" />
            <ellipse cx="50" cy="50" rx="45" ry="18" transform="rotate(90 50 50)" />
            <circle cx="50" cy="50" r="5" fill="currentColor" />
          </svg>

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              QUBIT |ψ⟩
            </span>
            <span className="text-[10px] font-mono text-emerald-400/60">SUPERPOSITION</span>
          </div>

          <div className="relative z-10 my-auto flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50 mb-2">
              <Atom className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-emerald-200 tracking-wide text-center">
              Quantum Computing
            </span>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] text-emerald-300/70 border-t border-emerald-900/40 pt-2">
            <span className="truncate max-w-[120px] font-medium">{publication}</span>
            <span className="font-mono text-[10px] bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/40 text-emerald-300">{pubInitial}</span>
          </div>
        </div>
      );

    case 'emerging':
      return (
        <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-amber-950 via-slate-950 to-orange-950 flex flex-col justify-between p-4 border-r border-amber-900/30">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
          <svg className="absolute -right-4 -bottom-4 w-36 h-36 text-amber-500/10 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="50,10 90,85 10,85" />
            <circle cx="50" cy="55" r="15" />
          </svg>

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              NEXT-GEN TECH
            </span>
            <Rocket className="w-3.5 h-3.5 text-amber-400" />
          </div>

          <div className="relative z-10 my-auto flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/50 mb-2">
              <Rocket className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-amber-200 tracking-wide text-center">
              Emerging Tech
            </span>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] text-amber-300/70 border-t border-amber-900/40 pt-2">
            <span className="truncate max-w-[120px] font-medium">{publication}</span>
            <span className="font-mono text-[10px] bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/40 text-amber-300">{pubInitial}</span>
          </div>
        </div>
      );

    case 'commentary':
      return (
        <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-950 to-blue-950 flex flex-col justify-between p-4 border-r border-indigo-900/30">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />
          {/* Editorial Quotes / Columns SVG */}
          <svg className="absolute -right-4 -bottom-4 w-36 h-36 text-indigo-500/10 pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
            <text x="10" y="70" fontSize="80" fontFamily="serif" fontWeight="bold">“</text>
          </svg>

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              ANALYSIS & OPINION
            </span>
            <span className="text-[10px] font-mono text-indigo-400/60">SUBSTACK</span>
          </div>

          <div className="relative z-10 my-auto flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-950/50 mb-2">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-indigo-200 tracking-wide text-center">
              Tech Commentary
            </span>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] text-indigo-300/70 border-t border-indigo-900/40 pt-2">
            <span className="truncate max-w-[120px] font-medium">{publication}</span>
            <span className="font-mono text-[10px] bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/40 text-indigo-300">{pubInitial}</span>
          </div>
        </div>
      );

    default:
      return (
        <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-slate-900 via-gray-950 to-zinc-900 flex flex-col justify-between p-4 border-r border-gray-800">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]" />
          <svg className="absolute -right-4 -bottom-4 w-36 h-36 text-slate-500/10 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="50" cy="50" r="40" />
            <circle cx="50" cy="50" r="25" />
            <line x1="50" y1="10" x2="50" y2="90" />
            <line x1="10" y1="50" x2="90" y2="50" />
          </svg>

          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-slate-500/20 text-slate-300 border border-slate-500/30">
              TECH RADAR
            </span>
            <Radio className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="relative z-10 my-auto flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-500/10 border border-slate-500/30 flex items-center justify-center text-slate-400 shadow-lg shadow-slate-950/50 mb-2">
              <Radio className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-200 tracking-wide text-center">
              General Tech
            </span>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-300/70 border-t border-slate-800 pt-2">
            <span className="truncate max-w-[120px] font-medium">{publication}</span>
            <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">{pubInitial}</span>
          </div>
        </div>
      );
  }
}

import { AppTheme } from '../types';

export interface ThemeStyles {
  bgApp: string;
  bgNav: string;
  bgPanel: string;
  bgSubPanel: string;
  borderMain: string;
  borderSub: string;
  textPrimary: string;
  textSecondary: string;
  textAccent: string;
  btnPrimary: string;
  btnSecondary: string;
  badge: string;
  cardShadow: string;
  highlightToken: string;
  inputBg: string;
}

export const themes: Record<AppTheme, ThemeStyles> = {
  monochrome: {
    bgApp: 'bg-zinc-950 text-zinc-100',
    bgNav: 'bg-zinc-950 border-b-2 border-zinc-300',
    bgPanel: 'bg-black border-2 border-zinc-300 shadow-[5px_5px_0px_0px_#d4d4d8]',
    bgSubPanel: 'bg-zinc-900 border-2 border-zinc-500',
    borderMain: 'border-zinc-300',
    borderSub: 'border-zinc-600',
    textPrimary: 'text-zinc-100 font-mono',
    textSecondary: 'text-zinc-400',
    textAccent: 'text-zinc-200 font-bold',
    btnPrimary: 'bg-zinc-300 text-black font-black uppercase tracking-wider hover:bg-zinc-200 border-2 border-zinc-300 shadow-[3px_3px_0px_0px_#d4d4d8] active:translate-x-0.5 active:translate-y-0.5',
    btnSecondary: 'bg-black text-zinc-200 font-bold uppercase tracking-wide hover:bg-zinc-900 border-2 border-zinc-300 shadow-[3px_3px_0px_0px_#d4d4d8] active:translate-x-0.5 active:translate-y-0.5',
    badge: 'bg-zinc-300 text-black border-2 border-zinc-300 font-mono font-bold uppercase',
    cardShadow: 'shadow-[5px_5px_0px_0px_#d4d4d8]',
    highlightToken: 'bg-zinc-300 text-black font-extrabold ring-2 ring-zinc-300',
    inputBg: 'bg-black border-2 border-zinc-300 text-zinc-100 placeholder-zinc-500',
  },
  amber: {
    bgApp: 'bg-zinc-950 text-amber-100',
    bgNav: 'bg-zinc-950 border-b-2 border-amber-500',
    bgPanel: 'bg-zinc-900 border-2 border-amber-500 shadow-[5px_5px_0px_0px_#f59e0b]',
    bgSubPanel: 'bg-zinc-950 border-2 border-amber-700',
    borderMain: 'border-amber-500',
    borderSub: 'border-amber-800',
    textPrimary: 'text-amber-100 font-sans',
    textSecondary: 'text-amber-400/80',
    textAccent: 'text-amber-400 font-bold',
    btnPrimary: 'bg-amber-500 text-black font-black uppercase tracking-wider hover:bg-amber-400 border-2 border-black shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5',
    btnSecondary: 'bg-zinc-950 text-amber-300 font-bold uppercase tracking-wide hover:bg-zinc-900 border-2 border-amber-500 shadow-[3px_3px_0px_0px_#f59e0b] active:translate-x-0.5 active:translate-y-0.5',
    badge: 'bg-amber-500/20 text-amber-300 border-2 border-amber-500 font-mono font-bold uppercase',
    cardShadow: 'shadow-[5px_5px_0px_0px_#f59e0b]',
    highlightToken: 'bg-amber-500 text-black font-extrabold ring-2 ring-amber-400',
    inputBg: 'bg-zinc-950 border-2 border-amber-500 text-amber-100 placeholder-amber-700',
  },
  matrix: {
    bgApp: 'bg-emerald-950 text-emerald-100',
    bgNav: 'bg-black border-b-2 border-emerald-500',
    bgPanel: 'bg-black border-2 border-emerald-500 shadow-[5px_5px_0px_0px_#10b981]',
    bgSubPanel: 'bg-emerald-950/80 border-2 border-emerald-700',
    borderMain: 'border-emerald-500',
    borderSub: 'border-emerald-800',
    textPrimary: 'text-emerald-100 font-mono',
    textSecondary: 'text-emerald-400/80',
    textAccent: 'text-emerald-400 font-bold',
    btnPrimary: 'bg-emerald-500 text-black font-black uppercase tracking-wider hover:bg-emerald-400 border-2 border-black shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5',
    btnSecondary: 'bg-black text-emerald-300 font-bold uppercase tracking-wide hover:bg-emerald-950 border-2 border-emerald-500 shadow-[3px_3px_0px_0px_#10b981] active:translate-x-0.5 active:translate-y-0.5',
    badge: 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500 font-mono font-bold uppercase',
    cardShadow: 'shadow-[5px_5px_0px_0px_#10b981]',
    highlightToken: 'bg-emerald-400 text-black font-extrabold ring-2 ring-emerald-300',
    inputBg: 'bg-black border-2 border-emerald-500 text-emerald-100 placeholder-emerald-700',
  },
  paper: {
    bgApp: 'bg-[#f4f4f0] text-black',
    bgNav: 'bg-[#f4f4f0] border-b-2 border-black',
    bgPanel: 'bg-white border-2 border-black shadow-[5px_5px_0px_0px_#000000]',
    bgSubPanel: 'bg-[#e8e8e2] border-2 border-black',
    borderMain: 'border-black',
    borderSub: 'border-zinc-800',
    textPrimary: 'text-black font-sans',
    textSecondary: 'text-zinc-700',
    textAccent: 'text-black font-extrabold',
    btnPrimary: 'bg-black text-white font-black uppercase tracking-wider hover:bg-zinc-800 border-2 border-black shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5',
    btnSecondary: 'bg-white text-black font-bold uppercase tracking-wide hover:bg-zinc-100 border-2 border-black shadow-[3px_3px_0px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5',
    badge: 'bg-black text-white border-2 border-black font-mono font-bold uppercase',
    cardShadow: 'shadow-[5px_5px_0px_0px_#000000]',
    highlightToken: 'bg-black text-white font-extrabold ring-2 ring-black',
    inputBg: 'bg-white border-2 border-black text-black placeholder-zinc-500',
  },
};

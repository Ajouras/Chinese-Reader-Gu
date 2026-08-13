import { AppThemePreset, CustomThemeConfig, SectionColors } from '../types';

export const THEME_PRESETS: {
  id: AppThemePreset;
  name: string;
  description: string;
  tag: string;
  colors: SectionColors;
}[] = [
  {
    id: 'amber-noir',
    name: 'Amber Noir (Default)',
    description: 'Deep obsidian dark canvas with warm gold and amber glowing accents.',
    tag: 'Classic Dark',
    colors: {
      appBg: '#020617', // slate-950
      navBg: '#020617',
      navBorder: '#1e293b',
      readerPanelBg: '#0f172a', // slate-900
      readerCanvasBg: '#020617',
      readerTextColor: '#f8fafc',
      readerHighlightBg: '#f59e0b44',
      readerHighlightText: '#fde68a',
      sidebarPanelBg: '#0f172a',
      sidebarCardBg: '#020617',
      cardSurfaceBg: '#0f172a',
      accentColor: '#f59e0b', // amber-500
      accentHover: '#fbbf24',
      accentTextColor: '#020617',
      pinyinColor: '#fb7185', // rose-400
    },
  },
  {
    id: 'paper-sepia',
    name: 'Parchment Scholar (Warm Sepia)',
    description: 'Soft traditional rice-paper background with rich charcoal ink and cinnabar seal accents.',
    tag: 'Warm Light',
    colors: {
      appBg: '#f6f1e8',
      navBg: '#ebe2d3',
      navBorder: '#d9cdb8',
      readerPanelBg: '#fbf8f2',
      readerCanvasBg: '#f4ede1',
      readerTextColor: '#2b2319',
      readerHighlightBg: '#c2410c33',
      readerHighlightText: '#9a3412',
      sidebarPanelBg: '#f7f2e8',
      sidebarCardBg: '#ece3d2',
      cardSurfaceBg: '#fbf8f2',
      accentColor: '#c2410c', // vermillion / cinnabar red
      accentHover: '#ea580c',
      accentTextColor: '#ffffff',
      pinyinColor: '#b91c1c',
    },
  },
  {
    id: 'cyber-emerald',
    name: 'Cyberpunk Jade (Matrix Void)',
    description: 'Ultra-dark pitch void with vibrant glowing jade green and lime typography.',
    tag: 'High Contrast Dark',
    colors: {
      appBg: '#050b08',
      navBg: '#07120c',
      navBorder: '#133522',
      readerPanelBg: '#091810',
      readerCanvasBg: '#040906',
      readerTextColor: '#ecfdf5',
      readerHighlightBg: '#10b98144',
      readerHighlightText: '#6ee7b7',
      sidebarPanelBg: '#091810',
      sidebarCardBg: '#060f0a',
      cardSurfaceBg: '#091810',
      accentColor: '#10b981', // emerald-500
      accentHover: '#34d399',
      accentTextColor: '#040906',
      pinyinColor: '#38bdf8', // sky-400
    },
  },
  {
    id: 'crimson-dynasty',
    name: 'Imperial Crimson (Palace Lacquer)',
    description: 'Deep dark burgundy lacquer background with royal gold borders and ruby highlights.',
    tag: 'Imperial Dark',
    colors: {
      appBg: '#110609',
      navBg: '#190a0e',
      navBorder: '#3d1620',
      readerPanelBg: '#200b12',
      readerCanvasBg: '#0d0407',
      readerTextColor: '#fdf2f4',
      readerHighlightBg: '#e11d4844',
      readerHighlightText: '#fecdd3',
      sidebarPanelBg: '#200b12',
      sidebarCardBg: '#130509',
      cardSurfaceBg: '#200b12',
      accentColor: '#e11d48', // rose/ruby-600
      accentHover: '#f43f5e',
      accentTextColor: '#ffffff',
      pinyinColor: '#fbbf24', // imperial gold
    },
  },
  {
    id: 'scholar-navy',
    name: 'Midnight Navy (Scholar Sapphire)',
    description: 'Deep oceanic night palette with crisp ice blue and silver accents.',
    tag: 'Deep Slate',
    colors: {
      appBg: '#060d1d',
      navBg: '#09142a',
      navBorder: '#1e2947',
      readerPanelBg: '#0c1a35',
      readerCanvasBg: '#040813',
      readerTextColor: '#f0f6fc',
      readerHighlightBg: '#38bdf844',
      readerHighlightText: '#7dd3fc',
      sidebarPanelBg: '#0c1a35',
      sidebarCardBg: '#060e20',
      cardSurfaceBg: '#0c1a35',
      accentColor: '#38bdf8', // sky-400
      accentHover: '#0ea5e9',
      accentTextColor: '#060d1d',
      pinyinColor: '#a78bfa', // purple-400
    },
  },
  {
    id: 'minimal-light',
    name: 'Studio Minimalist (Clean Light)',
    description: 'Crisp light slate layout with dense graphite typography and cobalt indigo controls.',
    tag: 'Minimal Light',
    colors: {
      appBg: '#f8fafc',
      navBg: '#ffffff',
      navBorder: '#e2e8f0',
      readerPanelBg: '#ffffff',
      readerCanvasBg: '#f1f5f9',
      readerTextColor: '#0f172a',
      readerHighlightBg: '#3b82f633',
      readerHighlightText: '#1d4ed8',
      sidebarPanelBg: '#ffffff',
      sidebarCardBg: '#f8fafc',
      cardSurfaceBg: '#ffffff',
      accentColor: '#2563eb', // blue-600
      accentHover: '#1d4ed8',
      accentTextColor: '#ffffff',
      pinyinColor: '#dc2626',
    },
  },
];

export const DEFAULT_THEME: CustomThemeConfig = {
  presetId: 'amber-noir',
  colors: THEME_PRESETS[0].colors,
};

const THEME_STORAGE_KEY = 'chinese_reader_gu_theme_config_v1';

export function getStoredTheme(): CustomThemeConfig {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.colors) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load theme:', e);
  }
  return DEFAULT_THEME;
}

export function saveStoredTheme(theme: CustomThemeConfig): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
  } catch (e) {
    console.error('Failed to save theme:', e);
  }
}

export function isColorLight(hexOrRgb: string): boolean {
  if (!hexOrRgb) return false;
  let hex = hexOrRgb.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 140;
}

export function applyThemeToDocument(theme: CustomThemeConfig): void {
  const root = document.documentElement;
  const c = theme.colors;
  const isLight = isColorLight(c.appBg);

  root.style.setProperty('--color-app-bg', c.appBg);
  root.style.setProperty('--color-nav-bg', c.navBg);
  root.style.setProperty('--color-nav-border', c.navBorder);
  root.style.setProperty('--color-reader-panel-bg', c.readerPanelBg);
  root.style.setProperty('--color-reader-canvas-bg', c.readerCanvasBg);
  root.style.setProperty('--color-reader-text', c.readerTextColor);
  root.style.setProperty('--color-reader-highlight-bg', c.readerHighlightBg);
  root.style.setProperty('--color-reader-highlight-text', c.readerHighlightText);
  root.style.setProperty('--color-sidebar-panel-bg', c.sidebarPanelBg);
  root.style.setProperty('--color-sidebar-card-bg', c.sidebarCardBg);
  root.style.setProperty('--color-card-surface-bg', c.cardSurfaceBg);
  root.style.setProperty('--color-accent', c.accentColor);
  root.style.setProperty('--color-accent-hover', c.accentHover);
  root.style.setProperty('--color-accent-text', c.accentTextColor);
  root.style.setProperty('--color-pinyin', c.pinyinColor);

  // Derived contrast colors for text & subtle elements
  if (isLight) {
    root.style.setProperty('--color-text-primary', '#1e293b');
    root.style.setProperty('--color-text-secondary', '#475569');
    root.style.setProperty('--color-text-muted', '#64748b');
    root.style.setProperty('--color-hover-bg', 'rgba(0, 0, 0, 0.06)');
    root.style.setProperty('--color-subcard-bg', c.sidebarCardBg);
    root.style.setProperty('--color-border-subtle', c.navBorder);
  } else {
    root.style.setProperty('--color-text-primary', '#f8fafc');
    root.style.setProperty('--color-text-secondary', '#94a3b8');
    root.style.setProperty('--color-text-muted', '#64748b');
    root.style.setProperty('--color-hover-bg', 'rgba(255, 255, 255, 0.05)');
    root.style.setProperty('--color-subcard-bg', c.sidebarCardBg);
    root.style.setProperty('--color-border-subtle', c.navBorder);
  }

  // Set theme data attribute for CSS styling
  root.setAttribute('data-theme', theme.presetId);
}

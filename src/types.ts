export interface CharacterBreakdown {
  char: string;
  pinyin: string;
  mean: string;
}

export interface Flashcard {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  contextSentence: string;
  contextTranslation: string;
  grammaticalNote?: string;
  breakdown?: CharacterBreakdown[];
  tags: string[];
  deckId: string;
  dateAdded: string;
  lastReviewed?: string;
  dueDate?: string; // ISO date string
  interval: number; // days
  easeFactor: number; // e.g. 2.5
  repetitions: number;
  state: 'new' | 'learning' | 'review' | 'mastered';
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  color?: string;
  createdAt: string;
}

export type DisplayField = 'chinese' | 'pinyin' | 'english' | 'context' | 'breakdown';

export type AppTheme = 'monochrome' | 'amber' | 'matrix' | 'paper';

export type AppThemePreset = 
  | 'amber-noir' 
  | 'paper-sepia' 
  | 'cyber-emerald' 
  | 'crimson-dynasty' 
  | 'scholar-navy' 
  | 'minimal-light' 
  | 'custom';

export interface SectionColors {
  navBg: string;
  navBorder: string;
  appBg: string;
  readerPanelBg: string;
  readerCanvasBg: string;
  readerTextColor: string;
  readerHighlightBg: string;
  readerHighlightText: string;
  sidebarPanelBg: string;
  sidebarCardBg: string;
  cardSurfaceBg: string;
  accentColor: string;
  accentHover: string;
  accentTextColor: string;
  pinyinColor: string;
}

export interface CustomThemeConfig {
  presetId: AppThemePreset;
  colors: SectionColors;
}

export interface CardDisplayConfig {
  frontFields: DisplayField[];
  backFields: DisplayField[];
  autoPlayAudio: boolean;
  showPinyinOnHover: boolean;
  theme: 'classic' | 'modern' | 'cyber' | 'warm';
  reviewOrder: 'due' | 'random' | 'newest' | 'oldest';
  useAiTranslation?: boolean;
  saveCardShortcut?: string;
}

export interface UserSettings {
  useAiTranslation: boolean;
  saveCardShortcut: string;
}

export interface TranslationResult {
  chinese: string;
  pinyin: string;
  english: string;
  contextSentence: string;
  contextTranslation: string;
  grammaticalNote?: string;
  breakdown: CharacterBreakdown[];
  mode: 'zh-to-en' | 'en-to-zh';
  selectedText: string;
  source?: string;
}

export interface BankStatus {
  cardCount: number;
  lastSaved: string | null;
  backupTime: string | null;
  hasBackup: boolean;
  isRecovered: boolean;
  fileSize: number;
}

export interface TextFileItem {
  filename: string;
  title: string;
  size: number;
  modifiedAt: string;
}

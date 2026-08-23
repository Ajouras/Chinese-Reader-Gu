import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Upload,
  Volume2,
  BookmarkPlus,
  Sparkles,
  RefreshCw,
  Sliders,
  Type,
  HelpCircle,
  CheckCircle2,
  BookMarked,
  WifiOff,
  GripVertical,
  FolderOpen,
  AlertCircle,
  Plus
} from 'lucide-react';
import { TranslationResult, Flashcard, TextFileItem } from '../types';
import { tokenizeText, getSurroundingSentence, speakText, TextToken, detectLinguisticUnitAtToken } from '../utils/textParser';
import { translateOfflineAsync } from '../utils/offlineDictionary';

function escapeRegex(str: string) {
  return str.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function renderHighlightedSentence(sentence: string, primaryTarget?: string, secondaryTarget?: string) {
  if (!sentence) return null;
  const cleanSent = sentence.replace(/^["“”']|["“”']$/g, '').trim();

  const terms = [primaryTarget, secondaryTarget]
    .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    .map((t) => t.trim().replace(/^["“”']|["“”']$/g, ''));

  if (terms.length === 0) {
    return <span>&ldquo;{cleanSent}&rdquo;</span>;
  }

  // Sort longest term first to ensure greedy match
  const sorted = [...new Set(terms)].sort((a, b) => b.length - a.length);
  const pattern = sorted.map(escapeRegex).join('|');
  const regex = new RegExp(`(${pattern})`, 'i');

  const parts = cleanSent.split(regex);
  const termLowerSet = new Set(sorted.map((t) => t.toLowerCase()));

  return (
    <span>
      &ldquo;
      {parts.map((part, idx) => {
        const isMatch = termLowerSet.has(part.toLowerCase());
        if (isMatch) {
          return (
            <mark
              key={idx}
              style={{
                backgroundColor: 'var(--color-reader-highlight-bg, rgba(245, 158, 11, 0.35))',
                color: 'var(--color-reader-highlight-text, #fef08a)',
                boxShadow: '0 0 0 1px var(--color-accent, #f59e0b)',
                borderRadius: '2px',
                padding: '1px 5px',
              }}
              className="font-bold underline decoration-amber-400 decoration-2 underline-offset-2 not-italic"
            >
              {part}
            </mark>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
      &rdquo;
    </span>
  );
}

interface ContextualReaderProps {
  onSaveToBank: (card: Omit<Flashcard, 'id' | 'dateAdded' | 'interval' | 'easeFactor' | 'repetitions' | 'state'>) => Promise<boolean>;
  deckNames: { id: string; name: string }[];
  useAiTranslation?: boolean;
  onToggleAiTranslation?: () => void;
  saveCardShortcut?: string;
}

export const ContextualReader: React.FC<ContextualReaderProps> = ({
  onSaveToBank,
  deckNames,
  useAiTranslation = false,
  onToggleAiTranslation,
  saveCardShortcut = 's',
}) => {
  // Text Library state
  const [textLibrary, setTextLibrary] = useState<TextFileItem[]>([]);
  const [selectedFilename, setSelectedFilename] = useState<string>('');
  const [isLoadingLibrary, setIsLoadingLibrary] = useState<boolean>(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  // Reader state
  const [inputText, setInputText] = useState<string>('');
  const [isEditingText, setIsEditingText] = useState<boolean>(false);
  const [sourceLang, setSourceLang] = useState<'zh' | 'en'>('zh');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('main');
  const [customTag, setCustomTag] = useState<string>('Reader');

  // Reader UI settings
  const [fontSize, setFontSize] = useState<number>(20);

  // Split pane resizable state
  const [splitPercent, setSplitPercent] = useState<number>(55);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Hover vs Click interaction state
  const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [activeSelectionRange, setActiveSelectionRange] = useState<{ start: number; end: number } | null>(null);

  // Translation state
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);

  // Refs & Caches
  const fileInputRef = useRef<HTMLInputElement>(null);
  const justSelectedRef = useRef<boolean>(false);
  const justSelectedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSelectingRef = useRef<boolean>(false);
  const clientCacheRef = useRef<Map<string, TranslationResult>>(new Map());

  // 1. Fetch text library on mount and when requested
  const fetchTextLibrary = async (targetFileToSelect?: string) => {
    setIsLoadingLibrary(true);
    setLibraryError(null);
    try {
      const res = await fetch('/api/texts');
      if (!res.ok) {
        throw new Error(`Failed to scan text library (HTTP ${res.status})`);
      }
      const data = await res.json();
      const files: TextFileItem[] = data.files || [];
      setTextLibrary(files);

      if (files.length > 0) {
        const fileToLoad = targetFileToSelect || selectedFilename || files[0].filename;
        const exists = files.some((f) => f.filename === fileToLoad);
        const resolvedName = exists ? fileToLoad : files[0].filename;
        await loadTextFile(resolvedName);
      } else {
        // Fallback default message if texts folder is empty
        setInputText('The texts/ library folder is currently empty. Place any .txt file in the texts/ folder or click "Upload .txt File" above to get started.');
        setSelectedFilename('');
      }
    } catch (err: any) {
      console.error('Error loading texts library:', err);
      setLibraryError('Unable to connect to the text library. Please check your texts/ folder.');
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  // 2. Load selected text file content
  const loadTextFile = async (filename: string) => {
    if (!filename) return;
    setIsLoadingLibrary(true);
    setLibraryError(null);
    try {
      const res = await fetch(`/api/texts/${encodeURIComponent(filename)}`);
      if (!res.ok) {
        throw new Error(`Could not load "${filename}". Status: ${res.status}`);
      }
      const data = await res.json();
      setInputText(data.content || '');
      setSelectedFilename(filename);
      // Reset active selection & translation when changing texts
      setActiveTokenId(null);
      setActiveToken(null);
      setActiveSelectionRange(null);
      setTranslation(null);
    } catch (err: any) {
      console.error(`Error loading text file ${filename}:`, err);
      setLibraryError(`Error: Failed to load "${filename}". Please select another file.`);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTextLibrary();
  }, []);

  // Global keydown listener for saving flashcards via user-configured shortcut key (e.g. 's')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const shortcutKey = (saveCardShortcut || 's').toLowerCase().trim();
      if (shortcutKey && e.key.toLowerCase() === shortcutKey) {
        if (translation && (translation.chinese || translation.english)) {
          e.preventDefault();
          handleSaveWord();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveCardShortcut, translation]);

  // Handle mobile detection for flex layout
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle horizontal dragging on splitter bar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingSplit || !containerRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const rect = containerRef.current.getBoundingClientRect();
      const newPercent = ((clientX - rect.left) / rect.width) * 100;
      if (newPercent >= 20 && newPercent <= 80) {
        setSplitPercent(newPercent);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSplit(false);
    };

    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingSplit]);

  // Auto-detect language when input text changes
  useEffect(() => {
    const sample = inputText.slice(0, 200);
    const hasChinese = /[\u4e00-\u9fa5]/.test(sample);
    setSourceLang(hasChinese ? 'zh' : 'en');
  }, [inputText]);

  // Memoize tokenization of current text
  const tokens = useMemo(() => tokenizeText(inputText, sourceLang === 'zh'), [inputText, sourceLang]);

  // Translate word/phrase with debouncing and fast caching
  const handleTranslate = async (word: string, contextSentence: string, tokenId?: string) => {
    if (!word || word.trim().length === 0) return;

    const trimmed = word.trim();
    // Accurately determine translation mode from the clicked word itself
    const hasChineseInWord = /[\u4e00-\u9fa5]/.test(trimmed);
    const isEnglishWord = !hasChineseInWord && /[a-zA-Z]/.test(trimmed);
    const mode: 'zh-to-en' | 'en-to-zh' = isEnglishWord ? 'en-to-zh' : (hasChineseInWord ? 'zh-to-en' : (sourceLang === 'zh' ? 'zh-to-en' : 'en-to-zh'));
    const cacheKey = `${mode}:${trimmed}:${contextSentence.trim()}:${useAiTranslation ? 'ai' : 'offline'}`;

    if (tokenId) {
      setActiveTokenId(tokenId);
    }
    setActiveToken(trimmed);
    setIsSavedSuccess(false);
    setTranslationError(null);

    // Fast client cache check to avoid duplicate calls
    if (clientCacheRef.current.has(cacheKey)) {
      setTranslation(clientCacheRef.current.get(cacheKey)!);
      setIsLoadingTranslation(false);
      return;
    }

    setIsLoadingTranslation(true);

    try {
      const res = await fetch('/api/translate-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          context: contextSentence,
          mode,
          useAi: useAiTranslation,
        }),
      });

      if (res.ok) {
        const data: TranslationResult = await res.json();
        clientCacheRef.current.set(cacheKey, data);
        setTranslation(data);
      } else {
        const offlineResult = await translateOfflineAsync(trimmed, contextSentence, mode);
        clientCacheRef.current.set(cacheKey, offlineResult);
        setTranslation(offlineResult);
      }
    } catch (err: any) {
      try {
        const offlineResult = await translateOfflineAsync(trimmed, contextSentence, mode);
        clientCacheRef.current.set(cacheKey, offlineResult);
        setTranslation(offlineResult);
      } catch (offErr) {
        setTranslationError('Could not translate selected text. Please try again.');
      }
    } finally {
      setIsLoadingTranslation(false);
    }
  };

  // Hover handler: ONLY updates visual cursor highlight. STRICTLY NO translation execution.
  const handleTokenMouseEnter = (token: TextToken) => {
    if (isSelectingRef.current) return;
    setHoveredTokenId(token.id);
  };

  const handleTokenMouseLeave = (token: TextToken) => {
    setHoveredTokenId((prev) => (prev === token.id ? null : prev));
  };

  // Click-to-Translate handler: captures token, runs phrase detection, extracts context sentence, and invokes translation
  const handleTokenClick = (token: TextToken) => {
    if (justSelectedRef.current) return;
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length > 0) return;

    // Detect complete linguistic unit / multi-word phrase or compound
    const isTokenChinese = /[\u4e00-\u9fa5]/.test(token.text);
    const detected = detectLinguisticUnitAtToken(inputText, token, isTokenChinese);

    // Highlight the selected phrase bounds
    setActiveTokenId(token.id);
    setActiveSelectionRange({ start: detected.startIndex, end: detected.endIndex });

    // Execute translation with clicked phrase & context
    handleTranslate(detected.phrase, detected.contextSentence, token.id);
  };

  // Check if a token falls within the active selected range or matches the active token ID
  const isTokenActive = (token: TextToken) => {
    if (!token.isWord) return false;

    if (activeSelectionRange) {
      return (
        token.startIndex >= activeSelectionRange.start &&
        token.endIndex <= activeSelectionRange.end
      );
    }

    if (activeTokenId) {
      return token.id === activeTokenId;
    }

    return false;
  };

  // Handle manual selection (drag selection)
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection) return;
    const rawSelectedStr = selection.toString().trim();
    if (rawSelectedStr.length > 0 && rawSelectedStr.length <= 300) {
      let cleanSelected = rawSelectedStr;
      const collapsed = cleanSelected.replace(/\s+/g, ' ');
      const noSpace = cleanSelected.replace(/\s+/g, '');

      let matchStart = -1;
      let matchEnd = -1;

      if (inputText.includes(rawSelectedStr)) {
        cleanSelected = rawSelectedStr;
        matchStart = inputText.indexOf(rawSelectedStr);
        matchEnd = matchStart + rawSelectedStr.length;
      } else if (inputText.includes(collapsed)) {
        cleanSelected = collapsed;
        matchStart = inputText.indexOf(collapsed);
        matchEnd = matchStart + collapsed.length;
      } else if (inputText.includes(noSpace) && /[\u4e00-\u9fa5]/.test(noSpace)) {
        cleanSelected = noSpace;
        matchStart = inputText.indexOf(noSpace);
        matchEnd = matchStart + noSpace.length;
      }

      if (matchStart >= 0) {
        setActiveSelectionRange({ start: matchStart, end: matchEnd });
        setActiveTokenId(null);
      }

      const context = getSurroundingSentence(inputText, cleanSelected, matchStart >= 0 ? matchStart : undefined);

      justSelectedRef.current = true;
      if (justSelectedTimerRef.current) clearTimeout(justSelectedTimerRef.current);
      justSelectedTimerRef.current = setTimeout(() => {
        justSelectedRef.current = false;
      }, 400);

      handleTranslate(cleanSelected, context);
    }
  };

  // File upload handler - saves to texts/ library and selects it
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.txt')) {
      setLibraryError('Only .txt text files can be added to the library.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          setIsLoadingLibrary(true);
          const saveRes = await fetch('/api/texts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              content,
            }),
          });
          if (saveRes.ok) {
            const data = await saveRes.json();
            await fetchTextLibrary(data.filename);
          } else {
            setInputText(content);
            setSelectedFilename(file.name);
          }
        } catch (err) {
          setInputText(content);
          setSelectedFilename(file.name);
        } finally {
          setIsLoadingLibrary(false);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset file input
  };

  // Save active translation to bank
  const handleSaveWord = async () => {
    if (!translation) return;

    const success = await onSaveToBank({
      chinese: translation.chinese,
      pinyin: translation.pinyin,
      english: translation.english,
      contextSentence: translation.contextSentence,
      contextTranslation: translation.contextTranslation,
      breakdown: translation.breakdown,
      tags: customTag ? [customTag] : ['Reader'],
      deckId: selectedDeckId,
    });

    if (success) {
      setIsSavedSuccess(true);
      setTimeout(() => setIsSavedSuccess(false), 2500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-4 font-sans">
      {/* Non-blocking Library Error Banner */}
      {libraryError && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            color: '#f87171',
          }}
          className="border p-3 flex items-center justify-between text-xs rounded-none transition-all"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{libraryError}</span>
          </div>
          <button
            onClick={() => setLibraryError(null)}
            className="hover:underline font-semibold ml-4 opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Controls & Toolbar */}
      <div 
        style={{
          backgroundColor: 'var(--color-reader-panel-bg)',
          borderColor: 'var(--color-nav-border)',
          color: 'var(--color-text-primary)'
        }}
        className="border rounded-none p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 transition-colors"
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Language Toggle */}
          <div 
            className="flex items-center p-1 border"
            style={{
              backgroundColor: 'var(--color-sidebar-card-bg)',
              borderColor: 'var(--color-nav-border)',
            }}
          >
            <button
              onClick={() => setSourceLang('zh')}
              style={{
                backgroundColor: sourceLang === 'zh' ? 'var(--color-reader-panel-bg)' : 'transparent',
                borderColor: sourceLang === 'zh' ? 'var(--color-accent)' : 'transparent',
                color: sourceLang === 'zh' ? 'var(--color-accent)' : 'var(--color-text-primary)',
              }}
              className="px-3 py-1.5 text-xs font-semibold transition border opacity-90 hover:opacity-100"
            >
              <span>中文 Chinese</span>
            </button>
            <button
              onClick={() => setSourceLang('en')}
              style={{
                backgroundColor: sourceLang === 'en' ? 'var(--color-reader-panel-bg)' : 'transparent',
                borderColor: sourceLang === 'en' ? 'var(--color-accent)' : 'transparent',
                color: sourceLang === 'en' ? 'var(--color-accent)' : 'var(--color-text-primary)',
              }}
              className="px-3 py-1.5 text-xs font-semibold transition border opacity-90 hover:opacity-100"
            >
              <span>English</span>
            </button>
          </div>

          {/* Text File Library Selector */}
          <div className="flex items-center space-x-1.5">
            <div className="flex items-center space-x-1 border px-2.5 py-1.5 text-xs font-semibold"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
                color: 'var(--color-accent)',
              }}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>texts/</span>
            </div>

            <select
              value={selectedFilename}
              onChange={(e) => {
                const name = e.target.value;
                if (name) {
                  loadTextFile(name);
                }
              }}
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
                color: 'var(--color-text-primary)',
              }}
              className="border rounded-none text-xs px-3 py-2 font-medium cursor-pointer max-w-[220px] truncate"
              title="Select reading material from texts/ library"
            >
              {textLibrary.length === 0 ? (
                <option value="">No texts found in texts/</option>
              ) : (
                textLibrary.map((file) => (
                  <option key={file.filename} value={file.filename}>
                    {file.title} ({(file.size / 1024).toFixed(1)} KB)
                  </option>
                ))
              )}
            </select>

            {/* Rescan / Refresh Library Button */}
            <button
              onClick={() => fetchTextLibrary()}
              disabled={isLoadingLibrary}
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
                color: 'var(--color-text-primary)',
              }}
              className="p-2 border rounded-none hover:opacity-90 transition"
              title="Rescan texts/ folder for newly added .txt files"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLibrary ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>

          {/* Engine Status Toggle Button */}
          <button
            onClick={onToggleAiTranslation}
            style={{
              backgroundColor: 'var(--color-sidebar-card-bg)',
              borderColor: useAiTranslation ? 'var(--color-accent)' : 'var(--color-nav-border)',
              color: useAiTranslation ? 'var(--color-accent)' : 'var(--color-text-primary)',
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-none text-xs font-semibold border transition opacity-90 hover:opacity-100"
            title={useAiTranslation ? 'Click to switch to 100% Offline CC-CEDICT Dictionary Engine' : 'Click to switch to Google Gemini AI Context Engine'}
          >
            {useAiTranslation ? (
              <>
                <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
                <span>Gemini AI Engine</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
                <span>Offline Engine (0ms)</span>
              </>
            )}
          </button>

          {/* Upload .txt file to library */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              backgroundColor: 'var(--color-sidebar-card-bg)',
              borderColor: 'var(--color-nav-border)',
              color: 'var(--color-text-primary)',
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-none text-xs font-semibold border transition opacity-90 hover:opacity-100"
            title="Import a .txt file into the texts/ library"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Add .txt File</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Font Size & Edit Toggle Controls */}
        <div className="flex items-center space-x-3">
          <div 
            style={{
              backgroundColor: 'var(--color-sidebar-card-bg)',
              borderColor: 'var(--color-nav-border)',
              color: 'var(--color-text-primary)'
            }}
            className="flex items-center space-x-1.5 border px-2 py-1"
          >
            <Type className="w-3.5 h-3.5 opacity-60" />
            <button
              onClick={() => setFontSize((prev) => Math.max(14, prev - 2))}
              className="px-1.5 py-0.5 text-xs font-bold hover:opacity-80"
              title="Decrease Font Size"
            >
              -
            </button>
            <span className="text-xs font-mono px-1 font-semibold">{fontSize}px</span>
            <button
              onClick={() => setFontSize((prev) => Math.min(36, prev + 2))}
              className="px-1.5 py-0.5 text-xs font-bold hover:opacity-80"
              title="Increase Font Size"
            >
              +
            </button>
          </div>

          <button
            onClick={() => setIsEditingText(!isEditingText)}
            style={{
              backgroundColor: isEditingText ? 'var(--color-accent)' : 'var(--color-sidebar-card-bg)',
              borderColor: isEditingText ? 'var(--color-accent)' : 'var(--color-nav-border)',
              color: isEditingText ? 'var(--color-accent-text)' : 'var(--color-text-primary)',
            }}
            className="px-3 py-1.5 text-xs font-semibold border rounded-none transition"
          >
            {isEditingText ? 'Done Editing' : 'Edit Text'}
          </button>
        </div>
      </div>

      {/* Main Resizable Workspace */}
      <div
        ref={containerRef}
        className={`flex ${isMobile ? 'flex-col space-y-4' : 'flex-row items-stretch'} w-full transition-all`}
      >
        {/* Left Panel: Text Reader */}
        <div
          style={{
            ...(isMobile ? {} : { width: `${splitPercent}%` }),
            backgroundColor: 'var(--color-reader-panel-bg, #090d16)',
            borderColor: 'var(--color-nav-border, #1e293b)',
            color: 'var(--color-text-primary, #ffffff)',
          }}
          className="w-full border rounded-none p-5 shadow-xl flex flex-col justify-between transition-colors duration-200"
        >
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: 'var(--color-nav-border)' }}>
              <div className="flex items-center space-x-2">
                <FileText 
                  style={{ color: 'var(--color-accent, #f59e0b)' }} 
                  className="w-4 h-4" 
                />
                <h2 className="text-sm font-bold tracking-wide">
                  {selectedFilename ? selectedFilename : 'Active Text'}
                </h2>
                <span className="text-[10px] opacity-60 font-mono">
                  ({tokens.filter((t) => t.isWord).length} {sourceLang === 'zh' ? 'characters/words' : 'words'})
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] font-mono opacity-70">
                <span>Click any word to translate</span>
              </div>
            </div>

            {isEditingText ? (
              <div className="space-y-2">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  style={{
                    fontSize: `${fontSize}px`,
                    backgroundColor: 'var(--color-reader-canvas-bg, #020617)',
                    borderColor: 'var(--color-nav-border)',
                    color: 'var(--color-reader-text, #f8fafc)',
                  }}
                  className="w-full border rounded-none p-4 font-sans focus:outline-none min-h-[360px] leading-relaxed shadow-inner"
                />
              </div>
            ) : (
              <div
                onMouseDown={() => {
                  isSelectingRef.current = true;
                }}
                onMouseUp={() => {
                  isSelectingRef.current = false;
                  handleTextSelection();
                }}
                onTouchEnd={() => {
                  isSelectingRef.current = false;
                  handleTextSelection();
                }}
                style={{ 
                  fontSize: `${fontSize}px`, 
                  lineHeight: 1.85,
                  backgroundColor: 'var(--color-reader-canvas-bg, #020617)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-reader-text, #f8fafc)',
                }}
                className="border rounded-none p-5 min-h-[360px] max-h-[500px] overflow-y-auto whitespace-pre-wrap select-text font-sans leading-relaxed tracking-wide transition-all shadow-inner"
              >
                {tokens.map((token) => {
                  const isActive = isTokenActive(token);
                  const isHovered = hoveredTokenId === token.id && !isActive;
                  const isInsideActiveRange =
                    activeSelectionRange !== null &&
                    token.startIndex >= activeSelectionRange.start &&
                    token.endIndex <= activeSelectionRange.end;

                  if (!token.isWord) {
                    if (isInsideActiveRange) {
                      return (
                        <span
                          key={token.id}
                          style={{
                            backgroundColor: 'var(--color-reader-highlight-bg, rgba(245, 158, 11, 0.35))',
                            color: 'var(--color-reader-highlight-text, #fef08a)',
                            boxShadow: 'inset 0 -2px 0 0 var(--color-accent, #f59e0b)',
                          }}
                          className="opacity-90 select-text inline"
                        >
                          {token.text}
                        </span>
                      );
                    }
                    return (
                      <span key={token.id} className="opacity-90 select-text">
                        {token.text}
                      </span>
                    );
                  }

                  return (
                    <span
                      key={token.id}
                      onClick={() => handleTokenClick(token)}
                      onMouseEnter={() => handleTokenMouseEnter(token)}
                      onMouseLeave={() => handleTokenMouseLeave(token)}
                      style={
                        isActive || isInsideActiveRange
                          ? {
                              backgroundColor: 'var(--color-reader-highlight-bg, rgba(245, 158, 11, 0.35))',
                              color: 'var(--color-reader-highlight-text, #fef08a)',
                              boxShadow: 'inset 0 -2px 0 0 var(--color-accent, #f59e0b)',
                            }
                          : isHovered
                          ? {
                              backgroundColor: 'rgba(245, 158, 11, 0.12)',
                              outline: '1px solid rgba(245, 158, 11, 0.45)',
                            }
                          : undefined
                      }
                      className={`inline cursor-pointer transition-colors duration-75 rounded-none font-normal ${
                        !isActive && !isInsideActiveRange && !isHovered ? 'hover:bg-amber-500/10' : ''
                      }`}
                      title="Click to translate"
                    >
                      {token.text}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Resizable Divider Bar */}
        <div
          onMouseDown={() => setIsDraggingSplit(true)}
          onTouchStart={() => setIsDraggingSplit(true)}
          style={{
            backgroundColor: 'var(--color-sidebar-card-bg)',
            borderColor: 'var(--color-nav-border)',
            color: 'var(--color-text-primary)'
          }}
          className={`hidden lg:flex items-center justify-center w-3 hover:w-4 mx-2 border cursor-col-resize group transition-all duration-150 my-2 flex-shrink-0 z-10 rounded-none ${
            isDraggingSplit ? 'w-4' : ''
          }`}
          title="Drag left or right to adjust panel width"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Right Panel: Contextual Translation & Card Generator */}
        <div
          style={{
            ...(isMobile ? {} : { flex: '1 1 0%', minWidth: 0 }),
            backgroundColor: 'var(--color-sidebar-panel-bg, #0f172a)',
            borderColor: 'var(--color-nav-border, #1e293b)',
            color: 'var(--color-text-primary, #ffffff)',
          }}
          className="w-full border rounded-none p-5 shadow-xl flex flex-col justify-between space-y-4 transition-colors duration-200"
        >
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: 'var(--color-nav-border)' }}>
              <div className="flex items-center space-x-2">
                <Sparkles 
                  style={{ color: 'var(--color-accent, #f59e0b)' }} 
                  className="w-4 h-4" 
                />
                <h2 className="text-sm font-bold tracking-wide">Context Breakdown</h2>
                {translation?.source && (
                  <span className={`text-[10px] px-2 py-0.5 font-mono uppercase font-bold border rounded-none ${
                    translation.source === 'gemini-ai'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : translation.source === 'offline-google-gtx'
                      ? 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {translation.source === 'gemini-ai' ? 'Gemini AI' : translation.source === 'offline-google-gtx' ? 'Phrase Engine' : 'Offline Lexicon'}
                  </span>
                )}
              </div>
              {translation && (
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => speakText(translation.chinese, 'zh-CN')}
                    style={{
                      backgroundColor: 'var(--color-sidebar-card-bg)',
                      color: 'var(--color-accent, #f59e0b)',
                      borderColor: 'var(--color-accent, #f59e0b)',
                    }}
                    className="flex items-center space-x-1 text-xs border px-2.5 py-1 rounded-none font-semibold transition"
                    title="Listen to Chinese pronunciation"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Audio (中文)</span>
                  </button>
                  {translation.english && (
                    <button
                      onClick={() => speakText(translation.english, 'en-US')}
                      style={{
                        backgroundColor: 'var(--color-sidebar-card-bg)',
                        color: 'var(--color-text-primary)',
                        borderColor: 'var(--color-nav-border)',
                      }}
                      className="flex items-center space-x-1 text-xs border px-2 py-1 rounded-none font-medium transition opacity-80 hover:opacity-100"
                      title="Listen to English pronunciation"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>EN</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Translation Output Area */}
            {isLoadingTranslation ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3 opacity-70">
                <RefreshCw 
                  style={{ color: 'var(--color-accent, #f59e0b)' }} 
                  className="w-8 h-8 animate-spin" 
                />
                <p className="text-xs font-medium">Analyzing Linguistic Unit...</p>
              </div>
            ) : translationError ? (
              <div 
                style={{
                  backgroundColor: 'var(--color-sidebar-card-bg)',
                  borderColor: 'rgba(244, 63, 94, 0.4)',
                }}
                className="border rounded-none p-4 text-rose-400 text-xs space-y-1"
              >
                <p className="font-bold">Error:</p>
                <p>{translationError}</p>
              </div>
            ) : translation ? (
              <div className="space-y-4 font-sans">
                {/* Chinese & Pinyin Display */}
                <div 
                  style={{ 
                    backgroundColor: 'var(--color-sidebar-card-bg, #020617)',
                    borderColor: 'var(--color-nav-border)',
                  }}
                  className="border rounded-none p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span 
                      style={{ color: 'var(--color-accent, #f59e0b)' }}
                      className="text-3xl font-extrabold font-serif tracking-wider"
                    >
                      {translation.chinese}
                    </span>
                    <span 
                      style={{ color: 'var(--color-pinyin, #fb7185)' }}
                      className="text-base font-semibold font-mono"
                    >
                      {translation.pinyin}
                    </span>
                  </div>
                  <div className="text-sm font-medium border-t pt-2 mt-2" style={{ borderColor: 'var(--color-nav-border)' }}>
                    {translation.english}
                  </div>
                </div>

                {/* Sentence Context */}
                <div 
                  style={{ 
                    backgroundColor: 'var(--color-sidebar-card-bg, #020617)',
                    borderColor: 'var(--color-nav-border)',
                  }}
                  className="border rounded-none p-3.5 space-y-2 text-xs"
                >
                  <div className="font-medium flex items-center space-x-1 opacity-80">
                    <BookMarked 
                      style={{ color: 'var(--color-accent, #f59e0b)' }} 
                      className="w-3.5 h-3.5" 
                    />
                    <span>In-Context Sentence:</span>
                  </div>
                  <div className="leading-relaxed opacity-95">
                    {renderHighlightedSentence(
                      translation.contextSentence,
                      translation.selectedText || (translation.mode === 'en-to-zh' ? translation.english : translation.chinese),
                      translation.mode === 'en-to-zh' ? translation.english : translation.chinese
                    )}
                  </div>
                  {translation.contextTranslation && (
                    <div className="pt-2 border-t opacity-90 leading-relaxed" style={{ borderColor: 'var(--color-nav-border)' }}>
                      <span className="opacity-60 mr-1 font-mono">→</span>
                      {renderHighlightedSentence(
                        translation.contextTranslation,
                        translation.mode === 'zh-to-en' ? translation.english : translation.chinese,
                        translation.mode === 'zh-to-en' ? translation.chinese : translation.selectedText
                      )}
                    </div>
                  )}
                </div>

                {/* Character Breakdown */}
                {translation.breakdown && translation.breakdown.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium opacity-80">Breakdown:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {translation.breakdown.map((item, idx) => (
                        <div
                          key={idx}
                          style={{ 
                            backgroundColor: 'var(--color-sidebar-card-bg, #020617)',
                            borderColor: 'var(--color-nav-border)',
                          }}
                          className="border rounded-none p-2 text-center text-xs space-y-0.5"
                        >
                          <div 
                            style={{ color: 'var(--color-accent, #f59e0b)' }}
                            className="text-base font-bold"
                          >
                            {item.char}
                          </div>
                          <div 
                            style={{ color: 'var(--color-pinyin, #fb7185)' }}
                            className="text-[11px] font-mono"
                          >
                            {item.pinyin}
                          </div>
                          <div className="text-[10px] opacity-70 truncate">{item.mean || (item as any).meaning || ''}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-60 space-y-3">
                <HelpCircle className="w-10 h-10 stroke-1" />
                <div className="space-y-1 max-w-xs">
                  <p className="text-xs font-semibold">Click Any Word or Phrase</p>
                  <p className="text-xs opacity-80">
                    Hovering highlights text. Click on any word to detect linguistic units, look up definitions, and view in-context translation.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Flashcard Save Controls */}
          {translation && (
            <div 
              style={{ 
                backgroundColor: 'var(--color-sidebar-card-bg, #020617)',
                borderColor: 'var(--color-nav-border)',
              }}
              className="border rounded-none p-3.5 space-y-3"
            >
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block mb-1 font-medium opacity-80">Deck</label>
                  <select
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
                    style={{
                      backgroundColor: 'var(--color-reader-panel-bg)',
                      borderColor: 'var(--color-nav-border)',
                      color: 'var(--color-text-primary)'
                    }}
                    className="w-full border rounded-none p-2 font-medium"
                  >
                    {deckNames.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-medium opacity-80">Tag</label>
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="e.g. Reader"
                    style={{
                      backgroundColor: 'var(--color-reader-panel-bg)',
                      borderColor: 'var(--color-nav-border)',
                      color: 'var(--color-text-primary)'
                    }}
                    className="w-full border rounded-none p-2 font-medium"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveWord}
                disabled={isSavedSuccess}
                style={
                  !isSavedSuccess
                    ? {
                        backgroundColor: 'var(--color-accent, #f59e0b)',
                        color: 'var(--color-accent-text, #020617)',
                      }
                    : undefined
                }
                className={`w-full py-2.5 px-4 rounded-none text-xs font-bold tracking-wide flex items-center justify-center space-x-2 transition-all ${
                  isSavedSuccess
                    ? 'bg-emerald-500 text-slate-950'
                    : 'hover:opacity-90 shadow-lg'
                }`}
              >
                {isSavedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Saved To Bank!</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4" />
                    <span>Save Flashcard</span>
                    <span 
                      className="ml-1 text-[10px] font-mono px-1.5 py-0.5 border rounded-none"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.15)',
                        borderColor: 'rgba(0,0,0,0.2)',
                        color: 'var(--color-accent-text, #020617)'
                      }}
                    >
                      [{saveCardShortcut.toUpperCase() || 'S'}]
                    </span>
                  </>
                )}
              </button>
              <div className="text-[10px] text-center font-mono opacity-70">
                Tip: Click any word and press <span style={{ color: 'var(--color-accent, #f59e0b)' }} className="font-bold">[{saveCardShortcut.toUpperCase() || 'S'}]</span> to save to flashcards
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
  ChevronRight,
  Split,
  Maximize2,
  BookMarked,
  Languages,
  WifiOff,
  GripVertical
} from 'lucide-react';
import { TranslationResult, Flashcard } from '../types';
import { tokenizeText, getSurroundingSentence, speakText, TextToken } from '../utils/textParser';
import { translateOffline, translateOfflineAsync } from '../utils/offlineDictionary';
import { SAMPLE_TEXTS } from '../data/sampleTexts';

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
  // Reader state
  const [inputText, setInputText] = useState<string>(SAMPLE_TEXTS[0].content);
  const [isEditingText, setIsEditingText] = useState<boolean>(false);
  const [sourceLang, setSourceLang] = useState<'zh' | 'en'>('zh');
  const [selectedDeckId, setSelectedDeckId] = useState<string>('main');
  const [customTag, setCustomTag] = useState<string>('Reader');

  // Reader UI settings
  const [fontSize, setFontSize] = useState<number>(20);
  const [interactionMode, setInteractionMode] = useState<'hover' | 'select'>('hover');

  // Split pane resizable state
  const [splitPercent, setSplitPercent] = useState<number>(55);
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active translation & exact token selection state
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  const [activeSelectionRange, setActiveSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [translation, setTranslation] = useState<TranslationResult | null>(null);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);

  // File upload & hover debounce refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hoverDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const justSelectedRef = useRef<boolean>(false);
  const justSelectedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSelectingRef = useRef<boolean>(false);
  const clientCacheRef = useRef<Map<string, TranslationResult>>(new Map());

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
        if (translation && translation.chinese) {
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
    const hasChinese = /[\u4e00-\u9fa5]/.test(inputText.slice(0, 100));
    setSourceLang(hasChinese ? 'zh' : 'en');
  }, [inputText]);

  // Memoize tokenization of current text
  const tokens = useMemo(() => tokenizeText(inputText, sourceLang === 'zh'), [inputText, sourceLang]);

  // Translate word with optional AI support (Default: high-accuracy offline engine)
  const handleTranslate = async (word: string, contextSentence: string, tokenId?: string) => {
    if (!word || word.trim().length === 0) return;

    const trimmed = word.trim();
    const mode = sourceLang === 'zh' ? 'zh-to-en' : 'en-to-zh';
    const cacheKey = `${mode}:${trimmed}:${contextSentence.trim()}:${useAiTranslation ? 'ai' : 'offline'}`;

    if (tokenId) {
      setActiveTokenId(tokenId);
      setActiveSelectionRange(null);
    }
    setActiveToken(trimmed);
    setIsSavedSuccess(false);
    setTranslationError(null);

    // Fast client cache check
    if (clientCacheRef.current.has(cacheKey)) {
      setTranslation(clientCacheRef.current.get(cacheKey)!);
      setIsLoadingTranslation(false);
      return;
    }

    setIsLoadingTranslation(true);

    if (useAiTranslation) {
      try {
        const res = await fetch('/api/translate-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: trimmed,
            context: contextSentence,
            mode,
            useAi: true,
          }),
        });

        if (!res.ok) throw new Error('AI Service call failed');
        const data: TranslationResult = await res.json();
        clientCacheRef.current.set(cacheKey, data);
        setTranslation(data);
      } catch (err: any) {
        const offlineResult = await translateOfflineAsync(trimmed, contextSentence, mode);
        clientCacheRef.current.set(cacheKey, offlineResult);
        setTranslation(offlineResult);
      } finally {
        setIsLoadingTranslation(false);
      }
    } else {
      try {
        const res = await fetch('/api/translate-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: trimmed,
            context: contextSentence,
            mode,
            useAi: false,
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
      } catch (e) {
        const offlineResult = await translateOfflineAsync(trimmed, contextSentence, mode);
        clientCacheRef.current.set(cacheKey, offlineResult);
        setTranslation(offlineResult);
      } finally {
        setIsLoadingTranslation(false);
      }
    }
  };

  // Handle token hover with fast, responsive debouncing
  const handleTokenHover = (token: TextToken) => {
    if (interactionMode !== 'hover') return;
    if (isSelectingRef.current) return;

    // Immediately highlight the hovered token without delay
    setActiveTokenId(token.id);
    setActiveSelectionRange(null);
    setActiveToken(token.text);

    if (hoverDebounceTimer.current) {
      clearTimeout(hoverDebounceTimer.current);
    }

    hoverDebounceTimer.current = setTimeout(() => {
      if (isSelectingRef.current) return;
      const context = getSurroundingSentence(inputText, token.text, token.startIndex);
      handleTranslate(token.text, context, token.id);
    }, 120);
  };

  // Helper to check if a token should be highlighted as active
  const isTokenActive = (token: TextToken) => {
    if (!token.isWord) return false;

    // If there is an active text selection range (drag selection)
    if (activeSelectionRange) {
      return (
        token.startIndex >= activeSelectionRange.start &&
        token.endIndex <= activeSelectionRange.end
      );
    }

    // Exact token ID match: highlights only the targeted word without affecting sibling words
    if (activeTokenId) {
      return token.id === activeTokenId;
    }

    return false;
  };

  // Handle manual selection of text
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection) return;
    const rawSelectedStr = selection.toString().trim();
    if (rawSelectedStr.length > 0 && rawSelectedStr.length <= 200) {
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

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
      }
    };
    reader.readAsText(file);
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

          {/* Sample Text Selector */}
          <select
            onChange={(e) => {
              const selected = SAMPLE_TEXTS.find((s) => s.id === e.target.value);
              if (selected) {
                setInputText(selected.content);
                setSourceLang(selected.lang);
              }
            }}
            defaultValue=""
            style={{
              backgroundColor: 'var(--color-sidebar-card-bg)',
              borderColor: 'var(--color-nav-border)',
              color: 'var(--color-text-primary)',
            }}
            className="border rounded-none text-xs px-3 py-2 font-medium cursor-pointer"
          >
            <option value="" disabled>
              📚 Load Sample Text...
            </option>
            {SAMPLE_TEXTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.category})
              </option>
            ))}
          </select>

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

          {/* Load via File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              backgroundColor: 'var(--color-sidebar-card-bg)',
              borderColor: 'var(--color-nav-border)',
              color: 'var(--color-text-primary)',
            }}
            className="flex items-center space-x-1.5 text-xs border px-3 py-2 rounded-none font-medium transition opacity-90 hover:opacity-100"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Open File</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".txt,.md,.json"
            className="hidden"
          />
        </div>

        {/* Font size, Interaction Mode & Edit Text Toggle */}
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-2">
            <Type className="w-4 h-4 opacity-80" />
            <input
              type="range"
              min="14"
              max="32"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-24 cursor-pointer"
              style={{ accentColor: 'var(--color-accent)' }}
            />
            <span className="w-8 text-right font-medium">{fontSize}px</span>
          </div>

          <div 
            className="flex items-center space-x-1 p-1 rounded-none border"
            style={{
              backgroundColor: 'var(--color-sidebar-card-bg)',
              borderColor: 'var(--color-nav-border)',
            }}
          >
            <button
              onClick={() => setInteractionMode('hover')}
              style={{
                backgroundColor: interactionMode === 'hover' ? 'var(--color-reader-panel-bg)' : 'transparent',
                borderColor: interactionMode === 'hover' ? 'var(--color-accent)' : 'transparent',
                color: interactionMode === 'hover' ? 'var(--color-accent)' : 'var(--color-text-primary)',
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-none transition border"
              title="Hover over any word to translate instantly"
            >
              Hover
            </button>
            <button
              onClick={() => setInteractionMode('select')}
              style={{
                backgroundColor: interactionMode === 'select' ? 'var(--color-reader-panel-bg)' : 'transparent',
                borderColor: interactionMode === 'select' ? 'var(--color-accent)' : 'transparent',
                color: interactionMode === 'select' ? 'var(--color-accent)' : 'var(--color-text-primary)',
              }}
              className="px-2.5 py-1 text-xs font-semibold rounded-none transition border"
              title="Highlight phrase with mouse cursor to translate"
            >
              Select
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout Container */}
      <div
        ref={containerRef}
        className={`flex flex-col lg:flex-row items-stretch min-h-[600px] gap-4 lg:gap-0 relative ${
          isDraggingSplit ? 'select-none cursor-col-resize' : ''
        }`}
      >
        {/* Left Panel: Text Reader Area */}
        <div
          style={{
            ...(isMobile ? {} : { flex: `0 0 ${splitPercent}%`, minWidth: 0 }),
            backgroundColor: 'var(--color-reader-panel-bg, #0f172a)',
            borderColor: 'var(--color-nav-border, #1e293b)',
            color: 'var(--color-text-primary, #ffffff)',
          }}
          className="w-full border rounded-none p-5 shadow-xl flex flex-col justify-between space-y-4 transition-colors duration-200"
        >
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: 'var(--color-nav-border)' }}>
              <div className="flex items-center space-x-2">
                <FileText 
                  style={{ color: 'var(--color-accent, #f59e0b)' }} 
                  className="w-4 h-4" 
                />
                <h2 className="text-sm font-bold tracking-wide">
                  {sourceLang === 'zh' ? 'Chinese Text Reader' : 'English Text Reader'}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditingText(!isEditingText)}
                  style={{
                    backgroundColor: isEditingText ? 'var(--color-accent)' : 'var(--color-sidebar-card-bg)',
                    color: isEditingText ? 'var(--color-accent-text)' : 'var(--color-accent)',
                    borderColor: 'var(--color-accent)',
                  }}
                  className="px-3 py-1 text-xs font-semibold rounded-none border transition"
                >
                  {isEditingText ? '📖 Interactive Reader' : '✏️ Edit Text'}
                </button>
              </div>
            </div>

            {/* Editable Text Area or Interactive View */}
            {isEditingText ? (
              <div className="space-y-2">
                <label className="text-xs opacity-80 font-medium block">
                  Edit Reader Source Text (Live editable):
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type or paste custom Chinese or English text here..."
                  rows={12}
                  style={{ 
                    fontSize: `${fontSize}px`, 
                    lineHeight: 1.6,
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
                  lineHeight: 1.8,
                  backgroundColor: 'var(--color-reader-canvas-bg, #020617)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-reader-text, #f8fafc)',
                }}
                className="border rounded-none p-5 min-h-[360px] max-h-[500px] overflow-y-auto whitespace-pre-wrap select-text font-sans leading-relaxed tracking-wide transition-all shadow-inner"
              >
                {tokens.map((token) => {
                  if (!token.isWord) {
                    return (
                      <span key={token.id} className="opacity-90 select-text">
                        {token.text}
                      </span>
                    );
                  }

                  const isActive = isTokenActive(token);

                  return (
                    <span
                      key={token.id}
                      onClick={() => {
                        if (justSelectedRef.current) return;
                        // If user currently has text selected, do not override selection with single token click
                        const sel = window.getSelection()?.toString().trim();
                        if (sel && sel.length > 0) return;

                        const context = getSurroundingSentence(inputText, token.text, token.startIndex);
                        handleTranslate(token.text, context, token.id);
                      }}
                      onMouseEnter={() => handleTokenHover(token)}
                      style={
                        isActive
                          ? {
                              backgroundColor: 'var(--color-reader-highlight-bg, rgba(245, 158, 11, 0.35))',
                              color: 'var(--color-reader-highlight-text, #fef08a)',
                              boxShadow: 'inset 0 -2px 0 0 var(--color-accent, #f59e0b)',
                            }
                          : undefined
                      }
                      className={`inline cursor-pointer transition-colors duration-75 rounded-none font-normal ${
                        !isActive ? 'hover:bg-amber-500/10' : ''
                      }`}
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
                <button
                  onClick={() => speakText(translation.chinese, 'zh-CN')}
                  style={{
                    backgroundColor: 'var(--color-sidebar-card-bg)',
                    color: 'var(--color-accent, #f59e0b)',
                    borderColor: 'var(--color-accent, #f59e0b)',
                  }}
                  className="flex items-center space-x-1 text-xs border px-2.5 py-1 rounded-none font-semibold transition"
                  title="Listen to native pronunciation"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Audio</span>
                </button>
              )}
            </div>

            {/* Translation Output Area */}
            {isLoadingTranslation ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3 opacity-70">
                <RefreshCw 
                  style={{ color: 'var(--color-accent, #f59e0b)' }} 
                  className="w-8 h-8 animate-spin" 
                />
                <p className="text-xs font-medium">Parsing Entry...</p>
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
                  <div className="flex items-baseline justify-between">
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
                  className="border rounded-none p-3.5 space-y-1.5 text-xs"
                >
                  <div className="font-medium flex items-center space-x-1 opacity-80">
                    <BookMarked 
                      style={{ color: 'var(--color-accent, #f59e0b)' }} 
                      className="w-3.5 h-3.5" 
                    />
                    <span>In-Context Sentence:</span>
                  </div>
                  <p className="italic leading-relaxed opacity-95">
                    "{translation.contextSentence}"
                  </p>
                  {translation.contextTranslation && (
                    <p className="pt-1 border-t opacity-80" style={{ borderColor: 'var(--color-nav-border)' }}>
                      → {translation.contextTranslation}
                    </p>
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
                          <div className="text-[10px] opacity-70 truncate">{item.mean}</div>
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
                  <p className="text-xs font-semibold">No Word Selected</p>
                  <p className="text-xs opacity-80">
                    Hover or click any word in the text reader to view instant pinyin & definition.
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
                Tip: Hover over any word and press <span style={{ color: 'var(--color-accent, #f59e0b)' }} className="font-bold">[{saveCardShortcut.toUpperCase() || 'S'}]</span> to save instantly
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

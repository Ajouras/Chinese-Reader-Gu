import React, { useState, useEffect } from 'react';
import {
  Volume2,
  RotateCcw,
  CheckCircle,
  XCircle,
  Settings2,
  Sparkles,
  Layers,
  Flame,
  Award,
  ChevronRight,
  Shuffle,
  Eye,
  Sliders,
  Check,
  Zap,
  Plus
} from 'lucide-react';
import { Flashcard, Deck, CardDisplayConfig, DisplayField } from '../types';
import { speakText } from '../utils/textParser';
import { DeckScanModal } from './DeckScanModal';

interface FlashcardReviewProps {
  cards: Flashcard[];
  decks: Deck[];
  onUpdateCard: (updatedCard: Flashcard) => void;
  onOpenAddCard: () => void;
  onBatchUpdateCards: (updatedCards: Flashcard[]) => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({
  cards,
  decks,
  onUpdateCard,
  onOpenAddCard,
  onBatchUpdateCards,
}) => {
  // Configurable Front / Back display preferences
  const [displayConfig, setDisplayConfig] = useState<CardDisplayConfig>({
    frontFields: ['chinese', 'pinyin'],
    backFields: ['english', 'context', 'breakdown'],
    autoPlayAudio: false,
    showPinyinOnHover: false,
    theme: 'modern',
    reviewOrder: 'due',
  });

  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);

  // Deck filter
  const [selectedDeck, setSelectedDeck] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Filtered cards array
  const activeCards = cards.filter((c) => {
    if (selectedDeck !== 'all' && c.deckId !== selectedDeck) return false;
    if (selectedTag !== 'all' && !c.tags.includes(selectedTag)) return false;
    return true;
  });

  // Review session state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [sessionReviewedCount, setSessionReviewedCount] = useState<number>(0);
  const [sessionCorrectCount, setSessionCorrectCount] = useState<number>(0);

  const currentCard = activeCards[currentIndex] || null;

  // Auto-play audio if enabled
  useEffect(() => {
    if (currentCard && displayConfig.autoPlayAudio) {
      speakText(currentCard.chinese, 'zh-CN');
    }
  }, [currentIndex, displayConfig.autoPlayAudio]);

  // Handle card grading with Anki SM-2 Spaced Repetition logic
  const handleGrade = (quality: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;

    let { interval, easeFactor, repetitions } = currentCard;

    // Anki SM-2 score mapping: again = 1, hard = 2, good = 4, easy = 5
    let score = 4;
    if (quality === 'again') score = 1;
    if (quality === 'hard') score = 2;
    if (quality === 'good') score = 4;
    if (quality === 'easy') score = 5;

    if (score < 3) {
      repetitions = 0;
      interval = 1; // repeat tomorrow or later today
    } else {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    }

    // Adjust ease factor
    easeFactor = easeFactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    // Calculate due date
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + interval);

    const updated: Flashcard = {
      ...currentCard,
      interval,
      easeFactor,
      repetitions,
      dueDate: nextDueDate.toISOString(),
      lastReviewed: new Date().toISOString(),
      state: repetitions >= 4 ? 'mastered' : 'review',
    };

    onUpdateCard(updated);

    // Track session stats
    setSessionReviewedCount((prev) => prev + 1);
    if (score >= 3) setSessionCorrectCount((prev) => prev + 1);

    // Advance to next card
    setIsFlipped(false);
    if (currentIndex < activeCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0); // Loop or end
    }
  };

  // Toggle field in front or back configuration
  const toggleField = (target: 'frontFields' | 'backFields', field: DisplayField) => {
    setDisplayConfig((prev) => {
      const currentList = prev[target];
      const exists = currentList.includes(field);
      let updated: DisplayField[];
      if (exists) {
        if (currentList.length <= 1) return prev; // keep at least 1 field
        updated = currentList.filter((f) => f !== field);
      } else {
        updated = [...currentList, field];
      }
      return { ...prev, [target]: updated };
    });
  };

  // Extract all available tags
  const allTags = Array.from(new Set(cards.flatMap((c) => c.tags || [])));

  // Helper renderer for card fields
  const renderCardFields = (fields: DisplayField[], card: Flashcard) => {
    return (
      <div className="space-y-4 text-center">
        {fields.includes('chinese') && (
          <div 
            className="text-4xl sm:text-5xl font-black font-serif tracking-wider"
            style={{ color: 'var(--color-reader-text)' }}
          >
            {card.chinese}
          </div>
        )}

        {fields.includes('pinyin') && (
          <div 
            className="text-lg font-mono font-bold"
            style={{ color: 'var(--color-pinyin)' }}
          >
            {card.pinyin}
          </div>
        )}

        {fields.includes('english') && (
          <div 
            className="text-xl font-bold max-w-md mx-auto leading-snug"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {card.english}
          </div>
        )}

        {fields.includes('context') && card.contextSentence && (
          <div 
            className="border p-3 text-xs italic max-w-lg mx-auto font-mono text-left"
            style={{
              backgroundColor: 'var(--color-sidebar-card-bg)',
              borderColor: 'var(--color-nav-border)',
              color: 'var(--color-text-primary)'
            }}
          >
            "{card.contextSentence}"
            {card.contextTranslation && (
              <div className="pt-1 not-italic font-bold opacity-80" style={{ color: 'var(--color-accent)' }}>
                → {card.contextTranslation}
              </div>
            )}
          </div>
        )}

        {fields.includes('breakdown') && card.breakdown && card.breakdown.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 pt-2 font-mono">
            {card.breakdown.map((b, i) => (
              <div 
                key={i} 
                className="border px-2.5 py-1 text-xs text-center"
                style={{
                  backgroundColor: 'var(--color-sidebar-card-bg)',
                  borderColor: 'var(--color-nav-border)',
                }}
              >
                <span className="font-bold" style={{ color: 'var(--color-reader-text)' }}>{b.char}</span>{' '}
                <span className="font-mono text-[11px]" style={{ color: 'var(--color-pinyin)' }}>{b.pinyin}</span>:{' '}
                <span className="opacity-80" style={{ color: 'var(--color-text-primary)' }}>{b.mean}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-6 font-sans">
      {/* Top Header & Config Toolbar */}
      <div 
        className="rounded-none p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 border"
        style={{
          backgroundColor: 'var(--color-reader-panel-bg)',
          borderColor: 'var(--color-nav-border)',
          color: 'var(--color-text-primary)'
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Deck Filter */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-medium opacity-80">Deck:</span>
            <select
              value={selectedDeck}
              onChange={(e) => {
                setSelectedDeck(e.target.value);
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="border rounded-none px-3 py-1.5 font-medium focus:outline-none"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              <option value="all">All Decks ({cards.length})</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({cards.filter((c) => c.deckId === d.id).length})
                </option>
              ))}
            </select>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-medium opacity-80">Tag:</span>
              <select
                value={selectedTag}
                onChange={(e) => {
                  setSelectedTag(e.target.value);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className="border rounded-none px-3 py-1.5 font-medium focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-sidebar-card-bg)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <option value="all">All Tags</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Customization Toggle & Session Stats */}
        <div className="flex items-center space-x-3 text-xs">
          <div 
            className="border px-3 py-1.5 rounded-none flex items-center space-x-3 font-mono"
            style={{
              backgroundColor: 'var(--color-sidebar-card-bg)',
              borderColor: 'var(--color-nav-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <span>Reviewed: <strong>{sessionReviewedCount}</strong></span>
            <span>Accuracy: <strong className="text-emerald-400 font-bold">{sessionReviewedCount > 0 ? Math.round((sessionCorrectCount / sessionReviewedCount) * 100) : 100}%</strong></span>
          </div>

          <button
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="flex items-center space-x-1.5 px-3 py-1.5 border text-xs font-semibold transition"
            style={{
              backgroundColor: isCustomizing ? 'var(--color-accent)' : 'var(--color-sidebar-card-bg)',
              color: isCustomizing ? 'var(--color-accent-text)' : 'var(--color-text-primary)',
              borderColor: isCustomizing ? 'var(--color-accent)' : 'var(--color-nav-border)',
            }}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Card</span>
          </button>

          <button
            onClick={() => setIsScanModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm border"
            style={{
              backgroundColor: 'var(--color-sidebar-card-bg)',
              borderColor: 'var(--color-accent)',
              color: 'var(--color-accent)',
            }}
            title="Audit entire active deck using Gemini AI to ensure accurate nuances and natural meanings"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scan Deck with Gemini</span>
          </button>

          <button
            onClick={onOpenAddCard}
            className="px-3 py-1.5 text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-accent-text)',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Card</span>
          </button>
        </div>
      </div>

      {/* Card Display Preferences Drawer */}
      {isCustomizing && (
        <div 
          className="rounded-none p-5 shadow-xl space-y-4 text-xs font-sans border"
          style={{
            backgroundColor: 'var(--color-reader-panel-bg)',
            borderColor: 'var(--color-nav-border)',
            color: 'var(--color-text-primary)'
          }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-nav-border)' }}>
            <h3 className="text-sm font-bold flex items-center space-x-2">
              <Settings2 className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              <span>Card Layout Config</span>
            </h3>
            <span className="opacity-80 font-medium">Select fields for front & back</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Front Fields */}
            <div 
              className="border rounded-none p-4 space-y-3"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
              }}
            >
              <span className="font-semibold block border-b pb-2" style={{ borderColor: 'var(--color-nav-border)' }}>
                🎴 Card Front:
              </span>
              <div className="flex flex-wrap gap-2">
                {(['chinese', 'pinyin', 'english', 'context'] as DisplayField[]).map((field) => {
                  const isSelected = displayConfig.frontFields.includes(field);
                  return (
                    <button
                      key={field}
                      onClick={() => toggleField('frontFields', field)}
                      className="px-3 py-1.5 rounded-none border flex items-center space-x-1.5 font-medium transition"
                      style={{
                        backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-reader-panel-bg)',
                        color: isSelected ? 'var(--color-accent-text)' : 'var(--color-text-primary)',
                        borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-nav-border)',
                      }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{field}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Back Fields */}
            <div 
              className="border rounded-none p-4 space-y-3"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
              }}
            >
              <span className="font-semibold block border-b pb-2" style={{ borderColor: 'var(--color-nav-border)' }}>
                🔄 Card Back:
              </span>
              <div className="flex flex-wrap gap-2">
                {(['chinese', 'pinyin', 'english', 'context', 'breakdown'] as DisplayField[]).map(
                  (field) => {
                    const isSelected = displayConfig.backFields.includes(field);
                    return (
                      <button
                        key={field}
                        onClick={() => toggleField('backFields', field)}
                        className="px-3 py-1.5 rounded-none border flex items-center space-x-1.5 font-medium transition"
                        style={{
                          backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-reader-panel-bg)',
                          color: isSelected ? 'var(--color-accent-text)' : 'var(--color-text-primary)',
                          borderColor: isSelected ? 'var(--color-accent)' : 'var(--color-nav-border)',
                        }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{field}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6 pt-2 border-t" style={{ borderColor: 'var(--color-nav-border)' }}>
            <label className="flex items-center space-x-2 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={displayConfig.autoPlayAudio}
                onChange={(e) => setDisplayConfig((p) => ({ ...p, autoPlayAudio: e.target.checked }))}
                className="w-4 h-4 rounded-none cursor-pointer"
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <span>Auto-play Chinese audio pronunciation on card show</span>
            </label>
          </div>
        </div>
      )}

      {/* Main Flashcard Interactive Stage */}
      {currentCard ? (
        <div className="space-y-6">
          {/* Card Counter Bar */}
          <div className="flex items-center justify-between text-xs font-sans px-1" style={{ color: 'var(--color-text-primary)' }}>
            <span className="font-medium opacity-80">
              Card <strong className="font-bold">{currentIndex + 1}</strong> of{' '}
              <strong>{activeCards.length}</strong>
            </span>
            <span 
              className="px-2.5 py-1 rounded-none border font-semibold text-[11px]"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
                color: 'var(--color-accent)',
              }}
            >
              {currentCard.state.toUpperCase()} • Interval: {currentCard.interval}d
            </span>
          </div>

          {/* Interactive Flashcard Box */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="rounded-none p-8 sm:p-12 min-h-[340px] flex flex-col justify-between items-center shadow-2xl cursor-pointer transition-all duration-200 relative select-none border"
            style={{
              backgroundColor: 'var(--color-card-surface-bg)',
              borderColor: 'var(--color-nav-border)',
              color: 'var(--color-text-primary)'
            }}
          >
            {/* Top Card Audio & Tag Badge */}
            <div className="w-full flex items-center justify-between text-xs font-sans">
              <div className="flex items-center space-x-2">
                <span 
                  className="border px-2.5 py-1 rounded-none font-medium"
                  style={{
                    backgroundColor: 'var(--color-sidebar-card-bg)',
                    borderColor: 'var(--color-nav-border)',
                    color: 'var(--color-accent)',
                  }}
                >
                  #{currentCard.tags[0] || 'Default'}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(currentCard.chinese, 'zh-CN');
                }}
                className="p-2 rounded-none border transition"
                style={{
                  backgroundColor: 'var(--color-sidebar-card-bg)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-accent)',
                }}
                title="Listen to Chinese Audio"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Central Card Content (Front or Back) */}
            <div className="my-auto py-6 text-center">
              {!isFlipped
                ? renderCardFields(displayConfig.frontFields, currentCard)
                : renderCardFields(displayConfig.backFields, currentCard)}
            </div>

            {/* Flip Indicator Footer */}
            <div 
              className="text-xs font-medium flex items-center space-x-2 pt-4 border-t w-full justify-center opacity-80"
              style={{ borderColor: 'var(--color-nav-border)' }}
            >
              <RotateCcw className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
              <span>{isFlipped ? 'Click or Space to flip Question (Front)' : 'Click or Space to Reveal Answer (Back)'}</span>
            </div>
          </div>

          {/* Anki SRS Review Grading Buttons */}
          <div 
            className="rounded-none p-4 shadow-xl font-sans border"
            style={{
              backgroundColor: 'var(--color-reader-panel-bg)',
              borderColor: 'var(--color-nav-border)',
              color: 'var(--color-text-primary)'
            }}
          >
            <div className="text-center text-xs mb-3 font-medium opacity-80">
              {!isFlipped ? 'Flip card to enable rating:' : 'Rate your recall:'}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => handleGrade('again')}
                className="border py-3 rounded-none font-bold text-xs transition flex flex-col items-center justify-center space-y-0.5"
                style={{
                  backgroundColor: 'var(--color-sidebar-card-bg)',
                  borderColor: '#f43f5e55',
                  color: '#fb7185',
                }}
              >
                <span className="text-sm">Again (1m)</span>
                <span className="text-[10px] opacity-70 font-normal">Forgot</span>
              </button>

              <button
                onClick={() => handleGrade('hard')}
                className="border py-3 rounded-none font-bold text-xs transition flex flex-col items-center justify-center space-y-0.5"
                style={{
                  backgroundColor: 'var(--color-sidebar-card-bg)',
                  borderColor: '#f59e0b55',
                  color: '#f59e0b',
                }}
              >
                <span className="text-sm">Hard ({Math.max(1, Math.round(currentCard.interval * 1.2))}d)</span>
                <span className="text-[10px] opacity-70 font-normal">Difficult</span>
              </button>

              <button
                onClick={() => handleGrade('good')}
                className="border py-3 rounded-none font-bold text-xs transition flex flex-col items-center justify-center space-y-0.5"
                style={{
                  backgroundColor: 'var(--color-sidebar-card-bg)',
                  borderColor: '#10b98155',
                  color: '#10b981',
                }}
              >
                <span className="text-sm">Good ({Math.max(1, Math.round(currentCard.interval * 2.5))}d)</span>
                <span className="text-[10px] opacity-70 font-normal">Normal</span>
              </button>

              <button
                onClick={() => handleGrade('easy')}
                className="border py-3 rounded-none font-bold text-xs transition flex flex-col items-center justify-center space-y-0.5"
                style={{
                  backgroundColor: 'var(--color-sidebar-card-bg)',
                  borderColor: '#38bdf855',
                  color: '#38bdf8',
                }}
              >
                <span className="text-sm">Easy ({Math.max(2, Math.round(currentCard.interval * 3.5))}d)</span>
                <span className="text-[10px] opacity-70 font-normal">Instant</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="rounded-none p-12 text-center space-y-4 shadow-xl font-sans border"
          style={{
            backgroundColor: 'var(--color-reader-panel-bg)',
            borderColor: 'var(--color-nav-border)',
            color: 'var(--color-text-primary)'
          }}
        >
          <Award className="w-16 h-16 mx-auto stroke-1" style={{ color: 'var(--color-accent)' }} />
          <h3 className="text-lg font-bold">No Cards Found</h3>
          <p className="text-xs max-w-sm mx-auto opacity-80">
            Add words from the Contextual Reader or manually create custom flashcards!
          </p>
          <button
            onClick={onOpenAddCard}
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold transition shadow-sm"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-accent-text)',
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Manually Create First Card</span>
          </button>
        </div>
      )}

      {/* Gemini Deck Nuance Audit Modal */}
      <DeckScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        cardsToScan={activeCards}
        selectedDeckName={
          selectedDeck === 'all'
            ? 'All Decks'
            : decks.find((d) => d.id === selectedDeck)?.name || 'Selected Deck'
        }
        onBatchUpdateCards={onBatchUpdateCards}
      />
    </div>
  );
};

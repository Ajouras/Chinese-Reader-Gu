import React from 'react';
import { HelpCircle, X, MousePointer, Keyboard, Layers, BookOpen, Zap, Sparkles } from 'lucide-react';

interface HowToPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  saveCardShortcut?: string;
}

export const HowToPracticeModal: React.FC<HowToPracticeModalProps> = ({
  isOpen,
  onClose,
  saveCardShortcut = 'S',
}) => {
  if (!isOpen) return null;

  const shortcutKey = (saveCardShortcut || 'S').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg shadow-2xl overflow-hidden rounded-none space-y-0 border"
        style={{
          backgroundColor: 'var(--color-reader-panel-bg)',
          borderColor: 'var(--color-nav-border)',
          color: 'var(--color-text-primary)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{
            backgroundColor: 'var(--color-sidebar-card-bg)',
            borderColor: 'var(--color-nav-border)',
          }}
        >
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            <h3 className="font-bold text-sm tracking-wide">
              How to Practice with Chinese Reader GU
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 transition opacity-70 hover:opacity-100"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
          <p className="leading-relaxed opacity-90">
            Chinese Reader GU is engineered for rapid, context-rich immersion reading and flashcard acquisition:
          </p>

          <div className="space-y-3">
            {/* Step 1 */}
            <div 
              className="flex items-start space-x-3 p-3 border"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
              }}
            >
              <div 
                className="p-2 border shrink-0"
                style={{
                  backgroundColor: 'var(--color-reader-panel-bg)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-accent)'
                }}
              >
                <MousePointer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs mb-0.5">1. Read & Instant Hover Lookup</h4>
                <p className="text-[11px] leading-relaxed opacity-80">
                  Hover over any word or character in the reader to view pinyin, HSK level, and offline CC-CEDICT definitions instantly with zero latency.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div 
              className="flex items-start space-x-3 p-3 border"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
              }}
            >
              <div 
                className="p-2 border shrink-0"
                style={{
                  backgroundColor: 'var(--color-reader-panel-bg)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-accent)'
                }}
              >
                <Keyboard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs mb-0.5">
                  2. One-Key Save to Cards <span className="font-mono" style={{ color: 'var(--color-accent)' }}>[{shortcutKey}]</span>
                </h4>
                <p className="text-[11px] leading-relaxed opacity-80">
                  Hover over a word and press <strong className="font-mono" style={{ color: 'var(--color-accent)' }}>[{shortcutKey}]</strong> on your keyboard to save it directly to your word bank with context examples. Custom key editable in Settings.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div 
              className="flex items-start space-x-3 p-3 border"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
              }}
            >
              <div 
                className="p-2 border shrink-0"
                style={{
                  backgroundColor: 'var(--color-reader-panel-bg)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-accent)'
                }}
              >
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs mb-0.5">3. Select Phrases & Sentences</h4>
                <p className="text-[11px] leading-relaxed opacity-80">
                  Highlight custom multi-word selections or sentences with your mouse for grammar breakdown and full sentence translation while maintaining consistent text spacing.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div 
              className="flex items-start space-x-3 p-3 border"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
              }}
            >
              <div 
                className="p-2 border shrink-0"
                style={{
                  backgroundColor: 'var(--color-reader-panel-bg)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-accent)'
                }}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs mb-0.5">4. Spaced Repetition (Cards)</h4>
                <p className="text-[11px] leading-relaxed opacity-80">
                  Switch to the <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>Cards</span> tab to practice flashcards using SuperMemo SM-2 spaced repetition, native TTS pronunciation, and deck scanning.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div 
              className="flex items-start space-x-3 p-3 border"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
              }}
            >
              <div 
                className="p-2 border shrink-0"
                style={{
                  backgroundColor: 'var(--color-reader-panel-bg)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-accent)'
                }}
              >
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs mb-0.5">5. Offline Speed & AI Experimental</h4>
                <p className="text-[11px] leading-relaxed opacity-80">
                  The app defaults to 100% offline dictionary lookups. You can toggle experimental Gemini AI context in Settings for advanced AI breakdown.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div 
          className="p-4 border-t flex justify-between items-center text-xs"
          style={{
            backgroundColor: 'var(--color-sidebar-card-bg)',
            borderColor: 'var(--color-nav-border)',
          }}
        >
          <span className="text-[11px] font-mono opacity-60">Chinese Reader GU Guide</span>
          <button
            onClick={onClose}
            className="font-bold px-4 py-1.5 transition shadow-sm"
            style={{
              backgroundColor: 'var(--color-accent)',
              color: 'var(--color-accent-text)'
            }}
          >
            Got it, Let's Read
          </button>
        </div>
      </div>
    </div>
  );
};

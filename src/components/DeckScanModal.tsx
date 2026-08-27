import React, { useState } from 'react';
import { X, Sparkles, Check, RefreshCw, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { Flashcard, Deck, CharacterBreakdown } from '../types';
import { mergeScannedDeckResults, ScannedCardResult } from '../utils/deckScanMerge';

interface DeckScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardsToScan: Flashcard[];
  selectedDeckName: string;
  onBatchUpdateCards: (updatedCards: Flashcard[]) => void;
}

export const DeckScanModal: React.FC<DeckScanModalProps> = ({
  isOpen,
  onClose,
  cardsToScan,
  selectedDeckName,
  onBatchUpdateCards,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResponse, setScanResponse] = useState<{
    summary: string;
    scannedCount: number;
    refinedCount: number;
    source: string;
    results: ScannedCardResult[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const handleStartScan = async () => {
    setIsScanning(true);
    setErrorMsg(null);
    setScanResponse(null);
    setApplied(false);

    try {
      const res = await fetch('/api/scan-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: cardsToScan,
          deckName: selectedDeckName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setScanResponse(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setErrorMsg(errData.error || 'Failed to scan deck using Gemini.');
      }
    } catch (e: any) {
      setErrorMsg('Network error while scanning deck.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyRefinements = () => {
    if (!scanResponse || !scanResponse.results) return;

    const updated = mergeScannedDeckResults(cardsToScan, scanResponse.results);

    onBatchUpdateCards(updated);
    setApplied(true);
    setTimeout(() => {
      onClose();
      setScanResponse(null);
      setApplied(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-3xl shadow-2xl p-6 relative space-y-5 font-sans max-h-[90vh] flex flex-col border rounded-none"
        style={{
          backgroundColor: 'var(--color-reader-panel-bg)',
          borderColor: 'var(--color-nav-border)',
          color: 'var(--color-text-primary)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 flex-shrink-0" style={{ borderColor: 'var(--color-nav-border)' }}>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            <div>
              <h3 className="text-base font-bold">
                Gemini Deck Nuance & Character Definition Audit
              </h3>
              <p className="text-xs opacity-80">
                Deck: <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>{selectedDeckName}</span> ({cardsToScan.length} cards)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 transition opacity-70 hover:opacity-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto space-y-4 flex-1 pr-1 font-sans text-xs">
          {!scanResponse && !isScanning && (
            <div 
              className="p-6 border text-center space-y-4 rounded-none"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
              }}
            >
              <div 
                className="w-12 h-12 border flex items-center justify-center mx-auto"
                style={{
                  backgroundColor: 'var(--color-reader-panel-bg)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-accent)'
                }}
              >
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold">
                  Scan Deck for Character Definitions & Translation Accuracy
                </h4>
                <p className="text-xs opacity-80 max-w-lg mx-auto leading-relaxed">
                  Gemini AI audits all <strong className="opacity-100">{cardsToScan.length}</strong> cards in this deck. It checks and refines individual Chinese character definitions and headwords <strong className="text-amber-300">if needed</strong>, while leaving accurate character definitions and glosses <strong className="text-emerald-300">untouched</strong>.
                </p>
              </div>

              {cardsToScan.length === 0 ? (
                <div 
                  className="p-3 border text-xs"
                  style={{
                    backgroundColor: 'var(--color-reader-panel-bg)',
                    borderColor: 'var(--color-accent)',
                    color: 'var(--color-accent)'
                  }}
                >
                  No cards available in this deck to scan. Add cards first!
                </div>
              ) : (
                <button
                  onClick={handleStartScan}
                  className="px-5 py-2.5 font-bold flex items-center space-x-2 mx-auto transition shadow-sm"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-accent-text)'
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start Gemini AI Deck Scan</span>
                </button>
              )}
            </div>
          )}

          {/* Scanning Progress */}
          {isScanning && (
            <div 
              className="py-12 text-center space-y-3 border rounded-none"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
              }}
            >
              <RefreshCw className="w-8 h-8 animate-spin mx-auto" style={{ color: 'var(--color-accent)' }} />
              <div className="space-y-1">
                <p className="text-sm font-bold">
                  Gemini AI is auditing deck and character definitions...
                </p>
                <p className="text-xs font-mono opacity-80">
                  Checking {cardsToScan.length} cards for character definitions, idiomatic accuracy & tone marks
                </p>
              </div>
            </div>
          )}

          {/* Error display */}
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Scan Results Display */}
          {scanResponse && (
            <div className="space-y-4">
              {/* Summary Banner */}
              <div 
                className="p-3.5 border flex items-center justify-between text-xs"
                style={{
                  backgroundColor: 'var(--color-sidebar-card-bg)',
                  borderColor: 'var(--color-nav-border)',
                }}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold">Scan Complete</span>
                    <span 
                      className="text-[10px] px-2 py-0.5 border font-mono"
                      style={{
                        backgroundColor: 'var(--color-reader-panel-bg)',
                        borderColor: 'var(--color-nav-border)',
                        color: 'var(--color-accent)'
                      }}
                    >
                      {scanResponse.source === 'gemini-ai' ? 'Gemini AI Engine' : 'Offline Lexicon'}
                    </span>
                  </div>
                  <p className="opacity-80 mt-1">{scanResponse.summary}</p>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold text-sm" style={{ color: 'var(--color-accent)' }}>
                    {scanResponse.refinedCount} / {scanResponse.scannedCount} Refined
                  </div>
                  <div className="text-[10px] opacity-60">Nuances & Characters Enhanced</div>
                </div>
              </div>

              {/* Refined Cards Comparison List */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold tracking-wider uppercase opacity-80">
                  Deck Cards Audit Results
                </h5>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {scanResponse.results.map((r) => {
                    const original = cardsToScan.find((c) => c.id === r.id);
                    const originalChinese = original?.chinese || '';
                    const chineseChanged = original && original.chinese !== r.chinese;

                    return (
                      <div
                        key={r.id}
                        className="p-3 border text-xs space-y-2 transition"
                        style={{
                          backgroundColor: r.wasRefined ? 'var(--color-card-surface-bg)' : 'var(--color-sidebar-card-bg)',
                          borderColor: r.wasRefined ? 'var(--color-accent)' : 'var(--color-nav-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 font-serif font-bold text-sm">
                            {chineseChanged && (
                              <span className="line-through text-xs opacity-60 mr-1" style={{ color: 'var(--color-reader-text)' }}>
                                {originalChinese} →
                              </span>
                            )}
                            <span style={{ color: 'var(--color-reader-text)' }}>{r.chinese}</span>
                            <span className="font-mono text-xs font-normal" style={{ color: 'var(--color-pinyin)' }}>
                              [{r.pinyin}]
                            </span>
                          </div>
                          {r.wasRefined ? (
                            <span 
                              className="text-[10px] border px-1.5 py-0.5 font-semibold"
                              style={{
                                backgroundColor: 'var(--color-sidebar-card-bg)',
                                borderColor: 'var(--color-accent)',
                                color: 'var(--color-accent)'
                              }}
                            >
                              Nuance Refined
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-emerald-400 opacity-90">
                              ✓ Verified Accurate
                            </span>
                          )}
                        </div>

                        {/* Translation comparison */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-0.5">
                          {r.wasRefined && original && original.english !== r.english && (
                            <div className="line-through text-[11px] opacity-60">
                              Was: {original.english}
                            </div>
                          )}
                          <div className="font-medium">
                            Gloss: <span className="font-bold" style={{ color: 'var(--color-accent)' }}>{r.english}</span>
                          </div>
                        </div>

                        {/* Individual Character Definitions Breakdown */}
                        {r.breakdown && r.breakdown.length > 0 && (
                          <div className="pt-1.5 border-t space-y-1" style={{ borderColor: 'var(--color-nav-border)' }}>
                            <span className="text-[10px] uppercase font-mono font-bold opacity-75">
                              Character Definitions:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {r.breakdown.map((item, idx) => {
                                const origChar = original?.breakdown?.find((ob) => ob.char === item.char);
                                const origMean = origChar ? (origChar.mean || (origChar as any).meaning || '') : '';
                                const charMeanChanged = origMean && origMean !== (item.mean || (item as any).meaning || '');

                                return (
                                  <div
                                    key={idx}
                                    className="border px-2 py-1 text-[11px] font-mono flex items-center space-x-1.5 rounded-none"
                                    style={{
                                      backgroundColor: 'var(--color-reader-panel-bg)',
                                      borderColor: charMeanChanged ? 'var(--color-accent)' : 'var(--color-nav-border)',
                                    }}
                                  >
                                    <span className="font-bold text-sm" style={{ color: 'var(--color-reader-text)' }}>
                                      {item.char}
                                    </span>
                                    <span style={{ color: 'var(--color-pinyin)' }}>
                                      {item.pinyin}
                                    </span>
                                    <span className="opacity-50">:</span>
                                    <span style={{ color: charMeanChanged ? 'var(--color-accent)' : 'var(--color-text-primary)' }} className={charMeanChanged ? 'font-bold' : 'opacity-90'}>
                                      {item.mean || (item as any).meaning || ''}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Reason / Nuance note */}
                        {r.refinementReason && r.wasRefined && (
                          <div className="text-[11px] opacity-75 font-mono">
                            Reason: {r.refinementReason}
                          </div>
                        )}

                        {r.grammaticalNote && (
                          <div 
                            className="text-[11px] p-1.5 border font-sans italic"
                            style={{
                              backgroundColor: 'var(--color-reader-panel-bg)',
                              borderColor: 'var(--color-nav-border)',
                            }}
                          >
                            <strong className="not-italic font-mono" style={{ color: 'var(--color-accent)' }}>Nuance Note:</strong> {r.grammaticalNote}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t pt-3 flex-shrink-0" style={{ borderColor: 'var(--color-nav-border)' }}>
          <button
            onClick={onClose}
            className="text-xs opacity-80 hover:opacity-100 font-medium px-3 py-1.5"
          >
            Close
          </button>

          {scanResponse && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleStartScan}
                disabled={isScanning}
                className="px-3 py-1.5 border text-xs font-semibold flex items-center space-x-1.5 transition"
                style={{
                  backgroundColor: 'var(--color-sidebar-card-bg)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Scan</span>
              </button>

              <button
                onClick={handleApplyRefinements}
                disabled={applied || scanResponse.refinedCount === 0}
                className="px-4 py-1.5 disabled:opacity-50 text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-accent-text)'
                }}
              >
                {applied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Applied to Deck!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Apply Refinement Updates ({scanResponse.refinedCount})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

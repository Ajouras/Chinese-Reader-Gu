import React, { useState } from 'react';
import { X, Plus, Sparkles, Check, Wand2 } from 'lucide-react';
import { pinyin } from 'pinyin-pro';
import { Flashcard, Deck } from '../types';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToBank: (
    cardData: Omit<Flashcard, 'id' | 'dateAdded' | 'interval' | 'easeFactor' | 'repetitions' | 'state'>
  ) => Promise<boolean>;
  decks: Deck[];
  defaultDeckId?: string;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({
  isOpen,
  onClose,
  onSaveToBank,
  decks,
  defaultDeckId = 'main',
}) => {
  const [chinese, setChinese] = useState('');
  const [pinyinText, setPinyinText] = useState('');
  const [english, setEnglish] = useState('');
  const [contextSentence, setContextSentence] = useState('');
  const [contextTranslation, setContextTranslation] = useState('');
  const [deckId, setDeckId] = useState(defaultDeckId);
  const [tagsInput, setTagsInput] = useState('manual, vocab');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto-generate Pinyin as user types Chinese if pinyin field is empty or was auto-generated
  const handleChineseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setChinese(val);
    if (val.trim()) {
      try {
        const generatedPinyin = pinyin(val, { toneType: 'symbol' });
        setPinyinText(generatedPinyin);
      } catch (err) {
        // ignore pinyin error
      }
    } else {
      setPinyinText('');
    }
  };

  const handleManualPinyinGen = () => {
    if (!chinese.trim()) return;
    try {
      const generated = pinyin(chinese, { toneType: 'symbol' });
      setPinyinText(generated);
    } catch (e) {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chinese.trim() || !english.trim()) return;

    setIsSubmitting(true);
    setSuccessMsg(null);

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const success = await onSaveToBank({
      chinese: chinese.trim(),
      pinyin: pinyinText.trim() || pinyin(chinese, { toneType: 'symbol' }),
      english: english.trim(),
      contextSentence: contextSentence.trim() || chinese.trim(),
      contextTranslation: contextTranslation.trim() || english.trim(),
      deckId,
      tags: parsedTags.length > 0 ? parsedTags : ['manual'],
    });

    setIsSubmitting(false);

    if (success) {
      setSuccessMsg('Card added to word bank successfully!');
      setTimeout(() => {
        setSuccessMsg(null);
        // Reset form
        setChinese('');
        setPinyinText('');
        setEnglish('');
        setContextSentence('');
        setContextTranslation('');
        onClose();
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg shadow-2xl p-6 relative space-y-5 font-sans border rounded-none"
        style={{
          backgroundColor: 'var(--color-reader-panel-bg)',
          borderColor: 'var(--color-nav-border)',
          color: 'var(--color-text-primary)'
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--color-nav-border)' }}>
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
            <h3 className="text-base font-bold">Add Manual Flashcard</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 transition opacity-70 hover:opacity-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto rounded-none">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-emerald-400">{successMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            {/* Chinese Hanzi & Pinyin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 opacity-90">
                  Chinese / Hanzi <span style={{ color: 'var(--color-accent)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={chinese}
                  onChange={handleChineseChange}
                  placeholder="e.g. 学习 or 塞翁失马"
                  required
                  className="w-full border p-2.5 font-serif font-bold text-base focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-sidebar-card-bg)',
                    borderColor: 'var(--color-nav-border)',
                    color: 'var(--color-reader-text)'
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold opacity-90">Pinyin</label>
                  <button
                    type="button"
                    onClick={handleManualPinyinGen}
                    className="text-[10px] flex items-center space-x-1 font-semibold"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Auto-Pinyin</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={pinyinText}
                  onChange={(e) => setPinyinText(e.target.value)}
                  placeholder="e.g. xué xí"
                  className="w-full border p-2.5 font-mono font-medium focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-sidebar-card-bg)',
                    borderColor: 'var(--color-nav-border)',
                    color: 'var(--color-pinyin)'
                  }}
                />
              </div>
            </div>

            {/* English Meaning */}
            <div>
              <label className="block font-semibold mb-1 opacity-90">
                English Meaning <span style={{ color: 'var(--color-accent)' }}>*</span>
              </label>
              <input
                type="text"
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
                placeholder="e.g. To study; to learn"
                required
                className="w-full border p-2.5 font-medium focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-sidebar-card-bg)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            {/* Context Sentence & Translation */}
            <div className="space-y-3 pt-1 border-t" style={{ borderColor: 'var(--color-nav-border)' }}>
              <div>
                <label className="block font-medium mb-1 opacity-80">
                  Context Sentence (Optional)
                </label>
                <input
                  type="text"
                  value={contextSentence}
                  onChange={(e) => setContextSentence(e.target.value)}
                  placeholder="e.g. 我们要努力学习中文。"
                  className="w-full border p-2 font-serif text-xs focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-sidebar-card-bg)',
                    borderColor: 'var(--color-nav-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>

              <div>
                <label className="block font-medium mb-1 opacity-80">
                  Context Translation (Optional)
                </label>
                <input
                  type="text"
                  value={contextTranslation}
                  onChange={(e) => setContextTranslation(e.target.value)}
                  placeholder="e.g. We must work hard to study Chinese."
                  className="w-full border p-2 text-xs focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-sidebar-card-bg)',
                    borderColor: 'var(--color-nav-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Deck & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t" style={{ borderColor: 'var(--color-nav-border)' }}>
              <div>
                <label className="block font-semibold mb-1 opacity-90">Target Deck</label>
                <select
                  value={deckId}
                  onChange={(e) => setDeckId(e.target.value)}
                  className="w-full border p-2 font-medium focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-sidebar-card-bg)',
                    borderColor: 'var(--color-nav-border)',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 opacity-90">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. hsk1, grammar"
                  className="w-full border p-2 font-medium focus:outline-none"
                  style={{
                    backgroundColor: 'var(--color-sidebar-card-bg)',
                    borderColor: 'var(--color-nav-border)',
                    color: 'var(--color-text-primary)'
                  }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2 pt-3 border-t" style={{ borderColor: 'var(--color-nav-border)' }}>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 opacity-80 hover:opacity-100 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !chinese.trim() || !english.trim()}
                className="px-5 py-2 disabled:opacity-50 font-bold flex items-center space-x-1.5 transition shadow-sm"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-accent-text)'
                }}
              >
                <Plus className="w-4 h-4" />
                <span>Save Card</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

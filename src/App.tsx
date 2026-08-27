import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ContextualReader } from './components/ContextualReader';
import { FlashcardReview } from './components/FlashcardReview';
import { WordBank } from './components/WordBank';
import { SettingsModal } from './components/SettingsModal';
import { AddCardModal } from './components/AddCardModal';
import { HowToPracticeModal } from './components/HowToPracticeModal';
import { Flashcard, Deck, BankStatus, CustomThemeConfig } from './types';
import { getStoredTheme, saveStoredTheme, applyThemeToDocument } from './utils/themeManager';

export default function App() {
  const [activeTab, setActiveTab] = useState<'reader' | 'flashcards' | 'bank' | 'settings'>('reader');
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  
  // Custom Theme & Section Color Customization state
  const [themeConfig, setThemeConfig] = useState<CustomThemeConfig>(() => getStoredTheme());

  useEffect(() => {
    applyThemeToDocument(themeConfig);
    saveStoredTheme(themeConfig);
  }, [themeConfig]);

  // User-configurable shortcut key to save card on hover (default 's')
  const [saveCardShortcut, setSaveCardShortcut] = useState<string>(() => {
    return localStorage.getItem('saveCardShortcut') || 's';
  });

  useEffect(() => {
    localStorage.setItem('saveCardShortcut', saveCardShortcut);
  }, [saveCardShortcut]);

  const [isAddCardOpen, setIsAddCardOpen] = useState<boolean>(false);

  // Flashcards state
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([
    {
      id: 'main',
      name: 'Main Deck',
      description: 'Default card deck',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'news',
      name: 'News & Media',
      description: 'Vocabulary from news articles',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'hsk',
      name: 'HSK Prep',
      description: 'Standard Chinese proficiency test words',
      createdAt: new Date().toISOString(),
    },
  ]);

  // Bank file backup status
  const [bankStatus, setBankStatus] = useState<BankStatus>({
    cardCount: 0,
    lastSaved: null,
    backupTime: null,
    hasBackup: false,
    isRecovered: false,
    fileSize: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load cards and decks from server on boot
  const loadBank = async () => {
    try {
      const [bankRes, decksRes] = await Promise.all([
        fetch('/api/bank'),
        fetch('/api/decks')
      ]);

      if (bankRes.ok) {
        const data = await bankRes.json();
        setCards(data.cards || []);
        if (data.status) {
          setBankStatus(data.status);
        }
      }

      if (decksRes.ok) {
        const decksData = await decksRes.json();
        if (Array.isArray(decksData.decks) && decksData.decks.length > 0) {
          setDecks(decksData.decks);
        }
      }
    } catch (err) {
      console.error('Error fetching bank/decks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBank();
  }, []);

  // Save updated decks array to backend file
  const saveDecksToServer = async (updatedDecks: Deck[]) => {
    setDecks(updatedDecks);
    try {
      await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decks: updatedDecks }),
      });
    } catch (err) {
      console.error('Failed to persist decks:', err);
    }
  };

  // Save updated cards array to backend file
  const saveCardsToServer = async (updatedCards: Flashcard[]) => {
    setCards(updatedCards);
    try {
      const res = await fetch('/api/bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: updatedCards }),
      });
      if (res.ok) {
        const data = await res.json();
        setBankStatus((prev) => ({
          ...prev,
          cardCount: updatedCards.length,
          lastSaved: data.lastSaved,
          backupTime: data.backupTime,
          hasBackup: true,
        }));
      }
    } catch (err) {
      console.error('Failed to persist cards:', err);
    }
  };

  // Save new word from Reader
  const handleSaveToBank = async (
    cardData: Omit<Flashcard, 'id' | 'dateAdded' | 'interval' | 'easeFactor' | 'repetitions' | 'state'>
  ): Promise<boolean> => {
    const newCard: Flashcard = {
      ...cardData,
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      dateAdded: new Date().toISOString(),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      state: 'new',
    };

    const updated = [newCard, ...cards];
    await saveCardsToServer(updated);
    return true;
  };

  // Update existing card after review
  const handleUpdateCard = (updatedCard: Flashcard) => {
    const updated = cards.map((c) => (c.id === updatedCard.id ? updatedCard : c));
    saveCardsToServer(updated);
  };

  // Batch update cards after Gemini deck scan
  const handleBatchUpdateCards = (updatedCardsList: Flashcard[]) => {
    const map = new Map(updatedCardsList.map((c) => [c.id, c]));
    const updated = cards.map((c) => map.get(c.id) || c);
    saveCardsToServer(updated);
  };

  // Delete card from bank
  const handleDeleteCard = (cardId: string) => {
    const updated = cards.filter((c) => c.id !== cardId);
    saveCardsToServer(updated);
  };

  // Create new Deck
  const handleCreateDeck = async (name: string, description: string) => {
    const newDeck: Deck = {
      id: `deck-${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString(),
    };
    const updated = [...decks, newDeck];
    await saveDecksToServer(updated);
  };

  // Rename existing Deck
  const handleRenameDeck = async (deckId: string, newName: string, newDescription?: string) => {
    const updated = decks.map((d) =>
      d.id === deckId
        ? { ...d, name: newName, description: newDescription !== undefined ? newDescription : d.description }
        : d
    );
    await saveDecksToServer(updated);
  };

  // Delete Deck with referential safety (reassign cards to 'main' default deck)
  const handleDeleteDeck = async (deckId: string) => {
    if (deckId === 'main') {
      alert('Cannot delete the default Main Deck.');
      return;
    }

    const updatedDecks = decks.filter((d) => d.id !== deckId);
    const updatedCards = cards.map((c) => (c.deckId === deckId ? { ...c, deckId: 'main' } : c));

    await Promise.all([
      saveDecksToServer(updatedDecks),
      saveCardsToServer(updatedCards),
    ]);
  };

  // Restore bank from corrupt-resistant backup
  const handleRestoreBackup = async () => {
    const res = await fetch('/api/bank/restore', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Restore failed');
    }
    const data = await res.json();
    if (data.cards) {
      setCards(data.cards);
      setBankStatus((prev) => ({ ...prev, cardCount: data.cards.length, isRecovered: true }));
    }
  };

  // Export cards
  const handleExportCards = (format: 'json' | 'csv') => {
    let content = '';
    let mimeType = 'text/plain';
    let filename = `flashcards-${Date.now()}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(cards, null, 2);
      mimeType = 'application/json';
    } else {
      // CSV format suitable for Anki import
      const headers = ['Chinese', 'Pinyin', 'English', 'ContextSentence', 'Tags'];
      const rows = cards.map((c) => [
        `"${c.chinese.replace(/"/g, '""')}"`,
        `"${c.pinyin.replace(/"/g, '""')}"`,
        `"${c.english.replace(/"/g, '""')}"`,
        `"${(c.contextSentence || '').replace(/"/g, '""')}"`,
        `"${(c.tags || []).join(',')}"`,
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import cards
  const handleImportCards = (fileContent: string) => {
    try {
      const parsed = JSON.parse(fileContent);
      if (Array.isArray(parsed)) {
        const merged = [...parsed, ...cards];
        saveCardsToServer(merged);
      }
    } catch (e) {
      alert('Could not parse JSON file.');
    }
  };

  // Calculate cards due today
  const dueCardsCount = cards.filter((c) => {
    if (!c.dueDate) return true; // new
    return new Date(c.dueDate) <= new Date();
  }).length;

  return (
    <div 
      style={{ 
        backgroundColor: themeConfig.colors.appBg,
        color: themeConfig.presetId === 'paper-sepia' || themeConfig.presetId === 'minimal-light' ? '#1e293b' : '#f8fafc'
      }}
      className="min-h-screen flex flex-col font-sans antialiased transition-colors duration-200"
    >
      {/* Top Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        bankStatus={bankStatus}
        dueCardsCount={dueCardsCount}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1 pb-12">
        {activeTab === 'reader' && (
          <ContextualReader
            onSaveToBank={handleSaveToBank}
            deckNames={decks.map((d) => ({ id: d.id, name: d.name }))}
            saveCardShortcut={saveCardShortcut}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardReview
            cards={cards}
            decks={decks}
            onUpdateCard={handleUpdateCard}
            onOpenAddCard={() => setIsAddCardOpen(true)}
            onBatchUpdateCards={handleBatchUpdateCards}
          />
        )}

        {activeTab === 'bank' && (
          <WordBank
            cards={cards}
            decks={decks}
            bankStatus={bankStatus}
            onDeleteCard={handleDeleteCard}
            onCreateDeck={handleCreateDeck}
            onRenameDeck={handleRenameDeck}
            onDeleteDeck={handleDeleteDeck}
            onRestoreBackup={handleRestoreBackup}
            onExportCards={handleExportCards}
            onImportCards={handleImportCards}
            onOpenAddCard={() => setIsAddCardOpen(true)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsModal
            saveCardShortcut={saveCardShortcut}
            setSaveCardShortcut={setSaveCardShortcut}
            themeConfig={themeConfig}
            setThemeConfig={setThemeConfig}
          />
        )}
      </main>

      {/* Manual Card Add Modal */}
      <AddCardModal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        onSaveToBank={handleSaveToBank}
        decks={decks}
      />

      {/* How to Practice Guide Modal */}
      <HowToPracticeModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        saveCardShortcut={saveCardShortcut}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/50 py-4 text-center text-xs text-slate-500 font-sans">
        <p>Chinese Reader GU • Offline Contextual Reader & SRS Flashcard Bank</p>
      </footer>
    </div>
  );
}

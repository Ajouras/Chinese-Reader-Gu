import React, { useState } from 'react';
import {
  Database,
  Search,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  FolderPlus,
  Tag,
  Volume2,
  FileJson,
  FileSpreadsheet,
  Check,
  AlertCircle
} from 'lucide-react';
import { Flashcard, Deck, BankStatus } from '../types';
import { speakText } from '../utils/textParser';

interface WordBankProps {
  cards: Flashcard[];
  decks: Deck[];
  bankStatus: BankStatus;
  onDeleteCard: (cardId: string) => void;
  onCreateDeck: (name: string, description: string) => void;
  onRenameDeck?: (deckId: string, newName: string, newDescription?: string) => void;
  onDeleteDeck?: (deckId: string) => void;
  onRestoreBackup: () => Promise<void>;
  onExportCards: (format: 'json' | 'csv') => void;
  onImportCards: (jsonOrCsv: string) => void;
  onOpenAddCard?: () => void;
}

export const WordBank: React.FC<WordBankProps> = ({
  cards,
  decks,
  bankStatus,
  onDeleteCard,
  onCreateDeck,
  onRenameDeck,
  onDeleteDeck,
  onRestoreBackup,
  onExportCards,
  onImportCards,
  onOpenAddCard,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeckFilter, setSelectedDeckFilter] = useState<string>('all');
  const [newDeckName, setNewDeckName] = useState<string>('');
  const [newDeckDesc, setNewDeckDesc] = useState<string>('');
  const [isCreatingDeck, setIsCreatingDeck] = useState<boolean>(false);
  const [isManagingDecks, setIsManagingDecks] = useState<boolean>(false);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editDeckName, setEditDeckName] = useState<string>('');
  const [editDeckDesc, setEditDeckDesc] = useState<string>('');
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);

  // Filtered cards list
  const filteredCards = cards.filter((card) => {
    if (selectedDeckFilter !== 'all' && card.deckId !== selectedDeckFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      card.chinese.toLowerCase().includes(q) ||
      card.pinyin.toLowerCase().includes(q) ||
      card.english.toLowerCase().includes(q) ||
      card.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const handleDeckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeckName.trim()) return;
    onCreateDeck(newDeckName.trim(), newDeckDesc.trim());
    setNewDeckName('');
    setNewDeckDesc('');
    setIsCreatingDeck(false);
  };

  const startEditingDeck = (deck: Deck) => {
    setEditingDeckId(deck.id);
    setEditDeckName(deck.name);
    setEditDeckDesc(deck.description || '');
  };

  const handleSaveDeckRename = (deckId: string) => {
    if (!editDeckName.trim()) return;
    if (onRenameDeck) {
      onRenameDeck(deckId, editDeckName.trim(), editDeckDesc.trim());
    }
    setEditingDeckId(null);
  };

  const handleDeleteDeckClick = (deck: Deck) => {
    if (deck.id === 'main') {
      alert('Cannot delete the default Main Deck.');
      return;
    }
    const deckCardsCount = cards.filter((c) => c.deckId === deck.id).length;
    const confirmMsg = deckCardsCount > 0
      ? `Delete deck "${deck.name}"? All ${deckCardsCount} cards in this deck will be safely moved to the Main Deck.`
      : `Delete deck "${deck.name}"?`;
    
    if (window.confirm(confirmMsg)) {
      if (onDeleteDeck) {
        onDeleteDeck(deck.id);
      }
      if (selectedDeckFilter === deck.id) {
        setSelectedDeckFilter('all');
      }
    }
  };

  const handleRestoreClick = async () => {
    setIsRestoring(true);
    setRestoreNotice(null);
    try {
      await onRestoreBackup();
      setRestoreNotice('Bank successfully restored from corruption backup file!');
    } catch (err: any) {
      setRestoreNotice(err.message || 'Failed to restore backup.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Import file handler
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportCards(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6 font-sans">
      {/* Top Bank & Backup Protection Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Card 1: Bank Integrity */}
        <div 
          className="border rounded-none p-5 shadow-xl flex items-center justify-between"
          style={{
            backgroundColor: 'var(--color-reader-panel-bg)',
            borderColor: 'var(--color-nav-border)',
            color: 'var(--color-text-primary)'
          }}
        >
          <div>
            <span className="text-xs font-medium opacity-80">Bank Storage</span>
            <h3 className="text-lg font-bold mt-0.5" style={{ color: 'var(--color-text-primary)' }}>
              flashcards.json
            </h3>
            <p className="text-xs mt-1 opacity-90">
              Total Saved: <strong className="font-semibold" style={{ color: 'var(--color-accent)' }}>{bankStatus.cardCount} cards</strong>
            </p>
          </div>
          <div 
            className="p-3 rounded-none border"
            style={{
              backgroundColor: 'var(--color-sidebar-card-bg)',
              borderColor: 'var(--color-nav-border)',
              color: 'var(--color-accent)'
            }}
          >
            <Database className="w-6 h-6" />
          </div>
        </div>

        {/* Status Card 2: Corrupt-Resistant Backup Status */}
        <div 
          className="border rounded-none p-5 shadow-xl flex items-center justify-between"
          style={{
            backgroundColor: 'var(--color-reader-panel-bg)',
            borderColor: 'var(--color-nav-border)',
            color: 'var(--color-text-primary)'
          }}
        >
          <div>
            <span className="text-xs font-medium opacity-80">Backup Safe File</span>
            <h3 className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>flashcards.json.bak</span>
            </h3>
            <p className="text-[11px] mt-1 font-medium opacity-80">
              {bankStatus.hasBackup ? 'Auto-Synchronized' : 'Initializing'}
            </p>
          </div>
          <button
            onClick={handleRestoreClick}
            disabled={isRestoring || !bankStatus.hasBackup}
            className="px-3 py-2 border rounded-none text-xs font-semibold transition flex items-center space-x-1 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-sidebar-card-bg)',
              borderColor: 'var(--color-nav-border)',
              color: 'var(--color-text-primary)'
            }}
            title="Restore main bank from backup file in case of data corruption"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
            <span>Restore Backup</span>
          </button>
        </div>

        {/* Status Card 3: Export & Import Tools */}
        <div 
          className="border rounded-none p-5 shadow-xl flex flex-col justify-between space-y-2"
          style={{
            backgroundColor: 'var(--color-reader-panel-bg)',
            borderColor: 'var(--color-nav-border)',
            color: 'var(--color-text-primary)'
          }}
        >
          <span className="text-xs font-medium opacity-80">Export Options</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onExportCards('json')}
              className="flex-1 py-1.5 px-2 border rounded-none text-xs font-semibold flex items-center justify-center space-x-1 transition"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <FileJson className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
              <span>JSON</span>
            </button>
            <button
              onClick={() => onExportCards('csv')}
              className="flex-1 py-1.5 px-2 border rounded-none text-xs font-semibold flex items-center justify-center space-x-1 transition"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-accent)',
                color: 'var(--color-accent)'
              }}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV (Anki)</span>
            </button>
          </div>
        </div>
      </div>

      {restoreNotice && (
        <div 
          className="border border-emerald-500/40 rounded-none p-3 text-xs text-emerald-300 font-medium flex items-center justify-between"
          style={{ backgroundColor: 'var(--color-reader-panel-bg)' }}
        >
          <span>{restoreNotice}</span>
          <button onClick={() => setRestoreNotice(null)} className="opacity-80 hover:opacity-100 font-bold text-sm">
            ×
          </button>
        </div>
      )}

      {/* Main Bank Content & Decks */}
      <div 
        className="border rounded-none p-5 shadow-2xl space-y-5"
        style={{
          backgroundColor: 'var(--color-reader-panel-bg)',
          borderColor: 'var(--color-nav-border)',
          color: 'var(--color-text-primary)'
        }}
      >
        {/* Toolbar: Search, Deck Filter, Create Deck */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 opacity-60" style={{ color: 'var(--color-text-primary)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Hanzi, Pinyin, English, or tags..."
                className="w-full border rounded-none pl-9 pr-3 py-2 text-xs font-medium focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-sidebar-card-bg)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>

            {/* Deck Filter */}
            <select
              value={selectedDeckFilter}
              onChange={(e) => setSelectedDeckFilter(e.target.value)}
              className="border rounded-none px-3 py-2 text-xs font-medium focus:outline-none"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-nav-border)',
                color: 'var(--color-text-primary)'
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

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 text-xs">
            {onOpenAddCard && (
              <button
                onClick={onOpenAddCard}
                className="px-3 py-2 font-bold flex items-center space-x-1.5 transition border shadow-sm"
                style={{
                  backgroundColor: 'var(--color-sidebar-card-bg)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                <Plus className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
                <span>+ Add Card</span>
              </button>
            )}
            <button
              onClick={() => {
                setIsManagingDecks(!isManagingDecks);
                if (isCreatingDeck) setIsCreatingDeck(false);
              }}
              className="px-3 py-2 font-bold flex items-center space-x-1.5 transition border shadow-sm"
              style={{
                backgroundColor: isManagingDecks ? 'var(--color-accent)' : 'var(--color-sidebar-card-bg)',
                borderColor: isManagingDecks ? 'var(--color-accent)' : 'var(--color-nav-border)',
                color: isManagingDecks ? 'var(--color-accent-text)' : 'var(--color-text-primary)'
              }}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isManagingDecks ? 'Done Managing' : 'Manage Decks'}</span>
            </button>
            <button
              onClick={() => {
                setIsCreatingDeck(!isCreatingDeck);
                if (isManagingDecks) setIsManagingDecks(false);
              }}
              className="px-3 py-2 font-bold flex items-center space-x-1.5 transition shadow-sm"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-accent-text)'
              }}
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ New Deck</span>
            </button>
          </div>
        </div>

        {/* Deck Management Panel (Rename & Delete) */}
        {isManagingDecks && (
          <div
            className="border rounded-none p-4 space-y-3 text-xs font-sans"
            style={{
              backgroundColor: 'var(--color-sidebar-card-bg)',
              borderColor: 'var(--color-nav-border)',
              color: 'var(--color-text-primary)'
            }}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm">Manage Flashcard Decks</h4>
              <span className="text-[11px] opacity-75">
                Deleting a deck safely reassigns its cards to the default Main Deck.
              </span>
            </div>

            <div className="space-y-2">
              {decks.map((d) => {
                const isEditing = editingDeckId === d.id;
                const isMain = d.id === 'main';
                const cardCount = cards.filter((c) => c.deckId === d.id).length;

                return (
                  <div
                    key={d.id}
                    className="border p-3 flex flex-wrap items-center justify-between gap-3"
                    style={{
                      backgroundColor: 'var(--color-reader-panel-bg)',
                      borderColor: 'var(--color-nav-border)',
                    }}
                  >
                    {isEditing ? (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editDeckName}
                          onChange={(e) => setEditDeckName(e.target.value)}
                          placeholder="Deck Name"
                          className="border p-1.5 font-medium focus:outline-none"
                          style={{
                            backgroundColor: 'var(--color-sidebar-card-bg)',
                            borderColor: 'var(--color-nav-border)',
                            color: 'var(--color-text-primary)',
                          }}
                        />
                        <input
                          type="text"
                          value={editDeckDesc}
                          onChange={(e) => setEditDeckDesc(e.target.value)}
                          placeholder="Optional Description"
                          className="border p-1.5 font-medium focus:outline-none"
                          style={{
                            backgroundColor: 'var(--color-sidebar-card-bg)',
                            borderColor: 'var(--color-nav-border)',
                            color: 'var(--color-text-primary)',
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {d.name}
                          </span>
                          {isMain && (
                            <span className="text-[10px] px-1.5 py-0.5 border border-emerald-500/40 text-emerald-400 font-semibold">
                              Default Deck
                            </span>
                          )}
                          <span className="text-[11px] opacity-75">
                            ({cardCount} {cardCount === 1 ? 'card' : 'cards'})
                          </span>
                        </div>
                        {d.description && (
                          <p className="text-[11px] opacity-70 mt-0.5">{d.description}</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveDeckRename(d.id)}
                            className="px-3 py-1 font-bold text-xs shadow-sm flex items-center space-x-1"
                            style={{
                              backgroundColor: 'var(--color-accent)',
                              color: 'var(--color-accent-text)',
                            }}
                          >
                            <Check className="w-3.5 h-3.5 inline" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => setEditingDeckId(null)}
                            className="px-2.5 py-1 border font-medium text-xs opacity-80 hover:opacity-100"
                            style={{
                              borderColor: 'var(--color-nav-border)',
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditingDeck(d)}
                            className="px-2.5 py-1 border font-semibold text-xs flex items-center space-x-1 transition hover:opacity-90"
                            style={{
                              backgroundColor: 'var(--color-sidebar-card-bg)',
                              borderColor: 'var(--color-nav-border)',
                              color: 'var(--color-text-primary)',
                            }}
                            title="Rename Deck"
                          >
                            <Edit2 className="w-3.5 h-3.5 inline" />
                            <span>Rename</span>
                          </button>
                          {!isMain && (
                            <button
                              onClick={() => handleDeleteDeckClick(d)}
                              className="px-2.5 py-1 border border-rose-500/40 text-rose-400 hover:text-rose-300 font-semibold text-xs flex items-center space-x-1 transition hover:bg-rose-500/10"
                              title="Delete Deck (Reassign cards to Main)"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                              <span>Delete</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* New Deck Creation Form */}
        {isCreatingDeck && (
          <form
            onSubmit={handleDeckSubmit}
            className="border rounded-none p-4 space-y-3 text-xs font-sans"
            style={{
              backgroundColor: 'var(--color-sidebar-card-bg)',
              borderColor: 'var(--color-nav-border)',
              color: 'var(--color-text-primary)'
            }}
          >
            <h4 className="font-bold">Create Flashcard Deck</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                placeholder="Deck Name (e.g. News, HSK4)"
                className="border rounded-none p-2 font-medium focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-reader-panel-bg)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-text-primary)'
                }}
                required
              />
              <input
                type="text"
                value={newDeckDesc}
                onChange={(e) => setNewDeckDesc(e.target.value)}
                placeholder="Optional description"
                className="border rounded-none p-2 font-medium focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-reader-panel-bg)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreatingDeck(false)}
                className="px-3 py-1.5 font-medium opacity-80 hover:opacity-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-none font-bold shadow-sm"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'var(--color-accent-text)'
                }}
              >
                Create Deck
              </button>
            </div>
          </form>
        )}

        {/* Cards Data Grid / Table */}
        <div 
          className="overflow-x-auto border rounded-none"
          style={{
            backgroundColor: 'var(--color-sidebar-card-bg)',
            borderColor: 'var(--color-nav-border)'
          }}
        >
          <table className="w-full text-left text-xs font-sans">
            <thead 
              className="font-semibold border-b text-[11px]"
              style={{
                backgroundColor: 'var(--color-reader-panel-bg)',
                borderColor: 'var(--color-nav-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <tr>
                <th className="py-3 px-4">Chinese</th>
                <th className="py-3 px-4">Pinyin</th>
                <th className="py-3 px-4">English Meaning</th>
                <th className="py-3 px-4">Context Sentence</th>
                <th className="py-3 px-4">Tags</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-nav-border)' }}>
              {filteredCards.length > 0 ? (
                filteredCards.map((card) => (
                  <tr 
                    key={card.id} 
                    className="transition-colors hover:opacity-90"
                    style={{ borderBottom: '1px solid var(--color-nav-border)' }}
                  >
                    <td 
                      className="py-3 px-4 font-serif font-bold text-lg"
                      style={{ color: 'var(--color-reader-text)' }}
                    >
                      {card.chinese}
                    </td>
                    <td 
                      className="py-3 px-4 font-mono font-medium"
                      style={{ color: 'var(--color-pinyin)' }}
                    >
                      {card.pinyin}
                    </td>
                    <td 
                      className="py-3 px-4 font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {card.english}
                    </td>
                    <td 
                      className="py-3 px-4 italic max-w-xs truncate opacity-80"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      "{card.contextSentence}"
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {card.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="border font-medium text-[10px] px-2 py-0.5 rounded-none"
                            style={{
                              backgroundColor: 'var(--color-reader-panel-bg)',
                              borderColor: 'var(--color-nav-border)',
                              color: 'var(--color-accent)'
                            }}
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => speakText(card.chinese, 'zh-CN')}
                        className="p-1 transition opacity-75 hover:opacity-100"
                        style={{ color: 'var(--color-accent)' }}
                        title="Listen"
                      >
                        <Volume2 className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => onDeleteCard(card.id)}
                        className="text-rose-400 hover:text-rose-300 p-1 transition"
                        title="Delete from Bank"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center font-medium opacity-60" style={{ color: 'var(--color-text-primary)' }}>
                    No vocabulary entries in word bank. Add words from Contextual Reader!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

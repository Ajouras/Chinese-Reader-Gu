import React from 'react';
import { BookOpen, Layers, Database, Settings, HelpCircle } from 'lucide-react';
import { BankStatus } from '../types';

interface NavbarProps {
  activeTab: 'reader' | 'flashcards' | 'bank' | 'settings';
  setActiveTab: (tab: 'reader' | 'flashcards' | 'bank' | 'settings') => void;
  bankStatus: BankStatus;
  dueCardsCount: number;
  onOpenGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  bankStatus,
  dueCardsCount,
  onOpenGuide,
}) => {
  return (
    <header 
      style={{
        backgroundColor: 'var(--color-nav-bg, #020617)',
        borderColor: 'var(--color-nav-border, #1e293b)',
        color: 'var(--color-text-primary, #ffffff)',
      }}
      className="border-b sticky top-0 z-40 font-sans transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand & Logo */}
          <div className="flex items-center space-x-3">
            <div 
              style={{
                backgroundColor: 'var(--color-accent, #f59e0b)',
                color: 'var(--color-accent-text, #020617)',
              }}
              className="font-black px-2 py-1 text-sm tracking-wider shadow-sm"
            >
              漢
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
                  Chinese Reader GU
                </span>
                <span 
                  style={{
                    backgroundColor: 'var(--color-sidebar-card-bg)',
                    borderColor: 'var(--color-nav-border)',
                    color: 'var(--color-accent)',
                  }}
                  className="text-[10px] border px-2 py-0.5 font-semibold hidden sm:inline-block font-mono"
                >
                  Reader Edition
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="nav-btn-reader"
              onClick={() => setActiveTab('reader')}
              style={{
                backgroundColor: activeTab === 'reader' ? 'var(--color-sidebar-card-bg)' : 'transparent',
                borderColor: activeTab === 'reader' ? 'var(--color-accent)' : 'transparent',
                color: activeTab === 'reader' ? 'var(--color-accent)' : 'var(--color-text-primary)',
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold transition border opacity-90 hover:opacity-100"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Reader</span>
            </button>

            <button
              id="nav-btn-flashcards"
              onClick={() => setActiveTab('flashcards')}
              style={{
                backgroundColor: activeTab === 'flashcards' ? 'var(--color-sidebar-card-bg)' : 'transparent',
                borderColor: activeTab === 'flashcards' ? 'var(--color-accent)' : 'transparent',
                color: activeTab === 'flashcards' ? 'var(--color-accent)' : 'var(--color-text-primary)',
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold transition relative border opacity-90 hover:opacity-100"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cards</span>
              {dueCardsCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2">
                  {dueCardsCount}
                </span>
              )}
            </button>

            <button
              id="nav-btn-bank"
              onClick={() => setActiveTab('bank')}
              style={{
                backgroundColor: activeTab === 'bank' ? 'var(--color-sidebar-card-bg)' : 'transparent',
                borderColor: activeTab === 'bank' ? 'var(--color-accent)' : 'transparent',
                color: activeTab === 'bank' ? 'var(--color-accent)' : 'var(--color-text-primary)',
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold transition border opacity-90 hover:opacity-100"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bank</span>
              <span 
                className="text-[10px] px-1.5 py-0.5 font-mono border"
                style={{
                  backgroundColor: 'var(--color-nav-bg)',
                  borderColor: 'var(--color-nav-border)',
                  color: 'var(--color-text-primary)'
                }}
              >
                {bankStatus.cardCount}
              </span>
            </button>

            <button
              id="nav-btn-settings"
              onClick={() => setActiveTab('settings')}
              style={{
                backgroundColor: activeTab === 'settings' ? 'var(--color-sidebar-card-bg)' : 'transparent',
                borderColor: activeTab === 'settings' ? 'var(--color-accent)' : 'transparent',
                color: activeTab === 'settings' ? 'var(--color-accent)' : 'var(--color-text-primary)',
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold transition border opacity-90 hover:opacity-100"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Settings</span>
            </button>

            <button
              id="nav-btn-guide"
              onClick={onOpenGuide}
              title="How to Practice Guide"
              style={{
                backgroundColor: 'var(--color-sidebar-card-bg)',
                borderColor: 'var(--color-accent)',
                color: 'var(--color-accent)',
              }}
              className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold border transition shadow-sm ml-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-bold">How to Practice</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};


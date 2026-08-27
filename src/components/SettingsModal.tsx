import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  Monitor, 
  Volume2, 
  WifiOff, 
  Sparkles, 
  Keyboard, 
  FlaskConical, 
  RotateCcw,
  Palette,
  Sliders,
  Check,
  Globe
} from 'lucide-react';
import { AppThemePreset, CustomThemeConfig, SectionColors } from '../types';
import { THEME_PRESETS, DEFAULT_THEME } from '../utils/themeManager';

interface SettingsModalProps {
  useAiTranslation?: boolean;
  setUseAiTranslation?: (val: boolean) => void;
  saveCardShortcut: string;
  setSaveCardShortcut: (val: string) => void;
  themeConfig: CustomThemeConfig;
  setThemeConfig: (theme: CustomThemeConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  saveCardShortcut,
  setSaveCardShortcut,
  themeConfig,
  setThemeConfig,
}) => {
  const [activeSectionTab, setActiveSectionTab] = useState<'presets' | 'custom'>('presets');

  const handleShortcutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val.length <= 10) {
      setSaveCardShortcut(val);
    }
  };

  const handleSelectPreset = (presetId: AppThemePreset) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setThemeConfig({
        presetId,
        colors: { ...preset.colors },
      });
    }
  };

  const handleColorChange = (key: keyof SectionColors, value: string) => {
    setThemeConfig({
      presetId: 'custom',
      colors: {
        ...themeConfig.colors,
        [key]: value,
      },
    });
  };

  const handleResetCurrentPreset = () => {
    const currentPreset = THEME_PRESETS.find((p) => p.id === themeConfig.presetId) || THEME_PRESETS[0];
    setThemeConfig({
      presetId: currentPreset.id,
      colors: { ...currentPreset.colors },
    });
  };

  const colors = themeConfig.colors;

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6 font-sans">
      {/* Header */}
      <div 
        className="rounded-none p-6 shadow-xl space-y-2 border"
        style={{
          backgroundColor: colors.readerPanelBg,
          borderColor: colors.navBorder,
          color: 'var(--color-text-primary)'
        }}
      >
        <h2 className="text-xl font-bold flex items-center space-x-2">
          <Settings className="w-5 h-5" style={{ color: colors.accentColor }} />
          <span>Chinese Reader GU — System Specs & Config</span>
        </h2>
        <p className="text-xs leading-relaxed opacity-80">
          Cross-platform offline Chinese reading tool built for Linux, macOS, and Windows with zero API latency, modular GUI theme customization, custom hover shortcuts, and automatic corrupt-resistant card bank protection.
        </p>
      </div>

      {/* GUI Themes & Section Color Customizer */}
      <div 
        className="rounded-none p-5 shadow-xl space-y-5 text-xs border"
        style={{
          backgroundColor: colors.readerPanelBg,
          borderColor: colors.navBorder,
          color: 'var(--color-text-primary)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: colors.navBorder }}>
          <div className="flex items-center space-x-2 font-bold">
            <Palette className="w-4 h-4" style={{ color: colors.accentColor }} />
            <span className="text-sm">GUI Themes & Modular Section Colors</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveSectionTab('presets')}
              className="px-3 py-1 text-xs font-semibold rounded-none border transition"
              style={{
                backgroundColor: activeSectionTab === 'presets' ? colors.accentColor : colors.sidebarCardBg,
                color: activeSectionTab === 'presets' ? colors.accentTextColor : 'var(--color-text-primary)',
                borderColor: activeSectionTab === 'presets' ? colors.accentColor : colors.navBorder,
              }}
            >
              Theme Presets
            </button>
            <button
              onClick={() => setActiveSectionTab('custom')}
              className="px-3 py-1 text-xs font-semibold rounded-none border transition flex items-center space-x-1"
              style={{
                backgroundColor: activeSectionTab === 'custom' ? colors.accentColor : colors.sidebarCardBg,
                color: activeSectionTab === 'custom' ? colors.accentTextColor : 'var(--color-text-primary)',
                borderColor: activeSectionTab === 'custom' ? colors.accentColor : colors.navBorder,
              }}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Section Color Customizer</span>
            </button>
          </div>
        </div>

        {activeSectionTab === 'presets' ? (
          /* Presets Grid */
          <div className="space-y-4">
            <p className="text-xs opacity-90">
              Choose from carefully calibrated aesthetic presets optimized for reading comfort and optical contrast:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {THEME_PRESETS.map((preset) => {
                const isSelected = themeConfig.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className="text-left p-3.5 border rounded-none transition relative flex flex-col justify-between space-y-3"
                    style={{
                      backgroundColor: colors.sidebarCardBg,
                      borderColor: isSelected ? colors.accentColor : colors.navBorder,
                      outline: isSelected ? `2px solid ${colors.accentColor}` : 'none',
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs flex items-center space-x-1.5" style={{ color: 'var(--color-text-primary)' }}>
                          <span>{preset.name}</span>
                        </span>
                        {isSelected && (
                          <span 
                            className="p-0.5 rounded-none"
                            style={{ backgroundColor: colors.accentColor, color: colors.accentTextColor }}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <span 
                        className="text-[10px] uppercase font-mono px-1.5 py-0.5 border"
                        style={{
                          backgroundColor: `${colors.accentColor}22`,
                          color: colors.accentColor,
                          borderColor: `${colors.accentColor}44`,
                        }}
                      >
                        {preset.tag}
                      </span>
                      <p className="text-[11px] mt-2 leading-relaxed opacity-75" style={{ color: 'var(--color-text-primary)' }}>
                        {preset.description}
                      </p>
                    </div>

                    {/* Color Swatch Preview Bar */}
                    <div className="flex items-center space-x-1 pt-2 border-t" style={{ borderColor: colors.navBorder }}>
                      <span
                        className="w-4 h-4 rounded-none border shadow-sm"
                        style={{ backgroundColor: preset.colors.appBg, borderColor: colors.navBorder }}
                        title="App Background"
                      />
                      <span
                        className="w-4 h-4 rounded-none border shadow-sm"
                        style={{ backgroundColor: preset.colors.readerCanvasBg, borderColor: colors.navBorder }}
                        title="Reader Canvas"
                      />
                      <span
                        className="w-4 h-4 rounded-none border shadow-sm"
                        style={{ backgroundColor: preset.colors.sidebarPanelBg, borderColor: colors.navBorder }}
                        title="Sidebar Panel"
                      />
                      <span
                        className="w-4 h-4 rounded-none border shadow-sm"
                        style={{ backgroundColor: preset.colors.accentColor, borderColor: colors.navBorder }}
                        title="Accent Tone"
                      />
                      <span
                        className="w-4 h-4 rounded-none border shadow-sm"
                        style={{ backgroundColor: preset.colors.pinyinColor, borderColor: colors.navBorder }}
                        title="Pinyin Accent"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Granular Section-by-Section Color Controls */
          <div className="space-y-5">
            <div 
              className="flex items-center justify-between p-3 border"
              style={{
                backgroundColor: colors.sidebarCardBg,
                borderColor: colors.navBorder,
              }}
            >
              <div>
                <span className="font-semibold block text-xs">Granular GUI Section Adjuster</span>
                <span className="text-[11px] opacity-80">
                  Current base: <strong className="uppercase font-mono" style={{ color: colors.accentColor }}>{themeConfig.presetId}</strong>
                </span>
              </div>
              <button
                onClick={handleResetCurrentPreset}
                className="px-2.5 py-1.5 border text-xs flex items-center space-x-1.5 transition"
                style={{
                  backgroundColor: colors.readerPanelBg,
                  borderColor: colors.navBorder,
                  color: 'var(--color-text-primary)',
                }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Preset</span>
              </button>
            </div>

            {/* Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Section 1: Navigation & Global Shell */}
              <div 
                className="border p-4 space-y-3"
                style={{ backgroundColor: colors.sidebarCardBg, borderColor: colors.navBorder }}
              >
                <h4 className="font-bold border-b pb-1.5 flex items-center space-x-1.5" style={{ borderColor: colors.navBorder }}>
                  <span className="w-2 h-2" style={{ backgroundColor: colors.accentColor }}></span>
                  <span>1. Navigation & App Shell</span>
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-90">App Background</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeConfig.colors.appBg}
                        onChange={(e) => handleColorChange('appBg', e.target.value)}
                        className="w-7 h-7 cursor-pointer border bg-transparent p-0"
                        style={{ borderColor: colors.navBorder }}
                      />
                      <span className="font-mono text-[11px] opacity-80 uppercase w-16">{themeConfig.colors.appBg}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-90">Navbar Background</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeConfig.colors.navBg}
                        onChange={(e) => handleColorChange('navBg', e.target.value)}
                        className="w-7 h-7 cursor-pointer border bg-transparent p-0"
                        style={{ borderColor: colors.navBorder }}
                      />
                      <span className="font-mono text-[11px] opacity-80 uppercase w-16">{themeConfig.colors.navBg}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-90">Navbar Border</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeConfig.colors.navBorder}
                        onChange={(e) => handleColorChange('navBorder', e.target.value)}
                        className="w-7 h-7 cursor-pointer border bg-transparent p-0"
                        style={{ borderColor: colors.navBorder }}
                      />
                      <span className="font-mono text-[11px] opacity-80 uppercase w-16">{themeConfig.colors.navBorder}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Reader & Text Canvas */}
              <div 
                className="border p-4 space-y-3"
                style={{ backgroundColor: colors.sidebarCardBg, borderColor: colors.navBorder }}
              >
                <h4 className="font-bold border-b pb-1.5 flex items-center space-x-1.5" style={{ borderColor: colors.navBorder }}>
                  <span className="w-2 h-2" style={{ backgroundColor: colors.pinyinColor }}></span>
                  <span>2. Contextual Reader & Canvas</span>
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-90">Reader Panel Box</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeConfig.colors.readerPanelBg}
                        onChange={(e) => handleColorChange('readerPanelBg', e.target.value)}
                        className="w-7 h-7 cursor-pointer border bg-transparent p-0"
                        style={{ borderColor: colors.navBorder }}
                      />
                      <span className="font-mono text-[11px] opacity-80 uppercase w-16">{themeConfig.colors.readerPanelBg}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-90">Text Canvas Surface</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeConfig.colors.readerCanvasBg}
                        onChange={(e) => handleColorChange('readerCanvasBg', e.target.value)}
                        className="w-7 h-7 cursor-pointer border bg-transparent p-0"
                        style={{ borderColor: colors.navBorder }}
                      />
                      <span className="font-mono text-[11px] opacity-80 uppercase w-16">{themeConfig.colors.readerCanvasBg}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-90">Chinese Text Color</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeConfig.colors.readerTextColor}
                        onChange={(e) => handleColorChange('readerTextColor', e.target.value)}
                        className="w-7 h-7 cursor-pointer border bg-transparent p-0"
                        style={{ borderColor: colors.navBorder }}
                      />
                      <span className="font-mono text-[11px] opacity-80 uppercase w-16">{themeConfig.colors.readerTextColor}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-90">Active Word Highlight</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeConfig.colors.readerHighlightText}
                        onChange={(e) => handleColorChange('readerHighlightText', e.target.value)}
                        className="w-7 h-7 cursor-pointer border bg-transparent p-0"
                        style={{ borderColor: colors.navBorder }}
                      />
                      <span className="font-mono text-[11px] opacity-80 uppercase w-16">{themeConfig.colors.readerHighlightText}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Sidebar Dictionary & Inspector */}
              <div 
                className="border p-4 space-y-3"
                style={{ backgroundColor: colors.sidebarCardBg, borderColor: colors.navBorder }}
              >
                <h4 className="font-bold border-b pb-1.5 flex items-center space-x-1.5" style={{ borderColor: colors.navBorder }}>
                  <span className="w-2 h-2" style={{ backgroundColor: colors.accentHover }}></span>
                  <span>3. Dictionary & Inspector Sidebar</span>
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-90">Sidebar Panel Background</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeConfig.colors.sidebarPanelBg}
                        onChange={(e) => handleColorChange('sidebarPanelBg', e.target.value)}
                        className="w-7 h-7 cursor-pointer border bg-transparent p-0"
                        style={{ borderColor: colors.navBorder }}
                      />
                      <span className="font-mono text-[11px] opacity-80 uppercase w-16">{themeConfig.colors.sidebarPanelBg}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-90">Definition Card Background</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeConfig.colors.sidebarCardBg}
                        onChange={(e) => handleColorChange('sidebarCardBg', e.target.value)}
                        className="w-7 h-7 cursor-pointer border bg-transparent p-0"
                        style={{ borderColor: colors.navBorder }}
                      />
                      <span className="font-mono text-[11px] opacity-80 uppercase w-16">{themeConfig.colors.sidebarCardBg}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-90">Pinyin Pronunciation Color</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeConfig.colors.pinyinColor}
                        onChange={(e) => handleColorChange('pinyinColor', e.target.value)}
                        className="w-7 h-7 cursor-pointer border bg-transparent p-0"
                        style={{ borderColor: colors.navBorder }}
                      />
                      <span className="font-mono text-[11px] opacity-80 uppercase w-16">{themeConfig.colors.pinyinColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Primary Accent & Action Buttons */}
              <div 
                className="border p-4 space-y-3"
                style={{ backgroundColor: colors.sidebarCardBg, borderColor: colors.navBorder }}
              >
                <h4 className="font-bold border-b pb-1.5 flex items-center space-x-1.5" style={{ borderColor: colors.navBorder }}>
                  <span className="w-2 h-2" style={{ backgroundColor: colors.accentColor }}></span>
                  <span>4. Primary Accents & Buttons</span>
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-90">Primary Accent Color</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeConfig.colors.accentColor}
                        onChange={(e) => handleColorChange('accentColor', e.target.value)}
                        className="w-7 h-7 cursor-pointer border bg-transparent p-0"
                        style={{ borderColor: colors.navBorder }}
                      />
                      <span className="font-mono text-[11px] opacity-80 uppercase w-16">{themeConfig.colors.accentColor}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-90">Button Text on Accent</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeConfig.colors.accentTextColor}
                        onChange={(e) => handleColorChange('accentTextColor', e.target.value)}
                        className="w-7 h-7 cursor-pointer border bg-transparent p-0"
                        style={{ borderColor: colors.navBorder }}
                      />
                      <span className="font-mono text-[11px] opacity-80 uppercase w-16">{themeConfig.colors.accentTextColor}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-90">Card Surface (Bank/Cards)</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={themeConfig.colors.cardSurfaceBg}
                        onChange={(e) => handleColorChange('cardSurfaceBg', e.target.value)}
                        className="w-7 h-7 cursor-pointer border bg-transparent p-0"
                        style={{ borderColor: colors.navBorder }}
                      />
                      <span className="font-mono text-[11px] opacity-80 uppercase w-16">{themeConfig.colors.cardSurfaceBg}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Config */}
      <div 
        className="rounded-none p-5 shadow-xl space-y-4 text-xs border"
        style={{
          backgroundColor: colors.readerPanelBg,
          borderColor: colors.navBorder,
          color: 'var(--color-text-primary)'
        }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: colors.navBorder }}>
          <div className="flex items-center space-x-2 font-bold">
            <Keyboard className="w-4 h-4" style={{ color: colors.accentColor }} />
            <span>Keyboard Shortcuts & Reader Controls</span>
          </div>
          <span 
            className="text-[10px] px-2.5 py-1 rounded-none border font-mono font-bold"
            style={{
              backgroundColor: colors.sidebarCardBg,
              color: colors.accentColor,
              borderColor: colors.navBorder,
            }}
          >
            Shortcut Active: [{saveCardShortcut.toUpperCase() || 'S'}]
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold block mb-1">
              Save to Flashcards Shortcut Key (Hover Mode)
            </label>
            <p className="text-[11px] leading-relaxed mb-2 opacity-80">
              Hover over any Chinese character or word in the Reader and press this key to instantly add it to your flashcard bank without clicking.
            </p>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={saveCardShortcut}
                onChange={handleShortcutChange}
                maxLength={10}
                placeholder="s"
                className="w-28 border font-mono text-center text-sm font-bold py-2 focus:outline-none uppercase shadow-inner"
                style={{
                  backgroundColor: colors.sidebarCardBg,
                  borderColor: colors.navBorder,
                  color: colors.accentColor,
                }}
              />
              <button
                onClick={() => setSaveCardShortcut('s')}
                className="px-3 py-2 border text-xs font-medium flex items-center space-x-1.5 transition"
                style={{
                  backgroundColor: colors.sidebarCardBg,
                  borderColor: colors.navBorder,
                  color: 'var(--color-text-primary)',
                }}
                title="Reset to default key 'S'"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default ('S')</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Experimental Features Section & Clarification */}
      <div 
        className="rounded-none p-5 shadow-xl space-y-4 text-xs border"
        style={{
          backgroundColor: colors.readerPanelBg,
          borderColor: colors.navBorder,
          color: 'var(--color-text-primary)'
        }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: colors.navBorder }}>
          <div className="flex items-center space-x-2 font-bold" style={{ color: colors.accentColor }}>
            <Sparkles className="w-4 h-4" />
            <span>Translation Engine Architecture</span>
          </div>
          <span 
            className="text-[10px] px-2.5 py-1 rounded-none border font-bold tracking-wider uppercase"
            style={{
              backgroundColor: `${colors.accentColor}22`,
              color: colors.accentColor,
              borderColor: `${colors.accentColor}44`,
            }}
          >
            Unified Fast Neural Pipeline
          </span>
        </div>

        <div className="space-y-4">
          <div 
            className="p-3 border space-y-3"
            style={{ backgroundColor: colors.sidebarCardBg, borderColor: colors.navBorder }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div 
                className="p-2.5 border space-y-1"
                style={{ backgroundColor: colors.readerPanelBg, borderColor: colors.navBorder }}
              >
                <div className="flex items-center space-x-1.5 font-bold" style={{ color: colors.accentColor }}>
                  <Globe className="w-3.5 h-3.5" />
                  <span>Primary: Google GTX Neural Translation</span>
                </div>
                <p className="leading-relaxed opacity-80">
                  Sends selected phrases and full sentence contexts in parallel directly to the high-speed Google GTX neural endpoint with a <strong>1.5s timeout</strong>. Provides instant, sentence-tuned translation with zero API key requirement.
                </p>
              </div>

              <div 
                className="p-2.5 border space-y-1"
                style={{ backgroundColor: colors.readerPanelBg, borderColor: colors.navBorder }}
              >
                <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Fallback: CC-CEDICT Lexicon</span>
                </div>
                <p className="leading-relaxed opacity-80">
                  If offline or if the network request times out, the engine seamlessly falls back to the local CC-CEDICT lexicon and single-character dictionary for reliable word glosses and tone breakdowns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Architecture Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cross Platform Runtime */}
        <div 
          className="rounded-none p-5 shadow-xl space-y-3 text-xs border"
          style={{
            backgroundColor: colors.readerPanelBg,
            borderColor: colors.navBorder,
            color: 'var(--color-text-primary)'
          }}
        >
          <div className="flex items-center space-x-2 font-bold border-b pb-2" style={{ borderColor: colors.navBorder }}>
            <Monitor className="w-4 h-4" style={{ color: colors.accentColor }} />
            <span>Cross-Platform Execution</span>
          </div>
          <p className="leading-relaxed opacity-80">
            Built on standard web technologies (React, Express, Vite):
          </p>
          <ul className="space-y-1.5 opacity-85 list-disc list-inside">
            <li><strong>Linux / macOS / Windows</strong>: Native cross-platform execution via Node environment</li>
            <li><strong>Instant Launch</strong>: Zero server start latency, zero quota rate limits</li>
            <li><strong>Local Bank Storage</strong>: Persisted locally in <code className="px-1.5 py-0.5 rounded-none font-mono border" style={{ backgroundColor: colors.sidebarCardBg, borderColor: colors.navBorder, color: colors.accentColor }}>data/flashcards.json</code></li>
          </ul>
        </div>

        {/* Corrupt-Resistant Storage */}
        <div 
          className="rounded-none p-5 shadow-xl space-y-3 text-xs border"
          style={{
            backgroundColor: colors.readerPanelBg,
            borderColor: colors.navBorder,
            color: 'var(--color-text-primary)'
          }}
        >
          <div className="flex items-center space-x-2 text-emerald-400 font-bold border-b pb-2" style={{ borderColor: colors.navBorder }}>
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Corrupt-Resistant Storage Protection</span>
          </div>
          <p className="leading-relaxed opacity-80">
            Two-stage atomic file save strategy:
          </p>
          <ol className="space-y-1.5 opacity-85 list-decimal list-inside">
            <li>Creates snapshot backup <code className="font-mono px-1.5 py-0.5 rounded-none border text-emerald-400" style={{ backgroundColor: colors.sidebarCardBg, borderColor: colors.navBorder }}>flashcards.json.bak</code></li>
            <li>Writes primary bank file <code className="font-mono px-1.5 py-0.5 rounded-none border text-emerald-400" style={{ backgroundColor: colors.sidebarCardBg, borderColor: colors.navBorder }}>flashcards.json</code></li>
            <li>Automatic failover restoration on launch if primary file is corrupted</li>
          </ol>
        </div>

        {/* 100% Offline CC-CEDICT Engine */}
        <div 
          className="rounded-none p-5 shadow-xl space-y-3 text-xs border"
          style={{
            backgroundColor: colors.readerPanelBg,
            borderColor: colors.navBorder,
            color: 'var(--color-text-primary)'
          }}
        >
          <div className="flex items-center space-x-2 text-emerald-400 font-bold border-b pb-2" style={{ borderColor: colors.navBorder }}>
            <WifiOff className="w-4 h-4 text-emerald-400" />
            <span>100% Client-Side Offline Dictionary</span>
          </div>
          <p className="leading-relaxed opacity-80">
            Uses full client-side CC-CEDICT dictionary & Pinyin Pro:
          </p>
          <ul className="space-y-1 opacity-85 list-disc list-inside">
            <li>Sub-millisecond instant lookup for hover & click</li>
            <li>No network requests, works completely offline</li>
            <li>Comprehensive Pinyin tone marks & English definitions</li>
          </ul>
        </div>

        {/* Text-To-Speech Pronunciation */}
        <div 
          className="rounded-none p-5 shadow-xl space-y-3 text-xs border"
          style={{
            backgroundColor: colors.readerPanelBg,
            borderColor: colors.navBorder,
            color: 'var(--color-text-primary)'
          }}
        >
          <div className="flex items-center space-x-2 font-bold border-b pb-2" style={{ borderColor: colors.navBorder }}>
            <Volume2 className="w-4 h-4" style={{ color: colors.pinyinColor }} />
            <span>Native Speech Synthesis</span>
          </div>
          <p className="leading-relaxed opacity-80">
            Uses browser Web Speech Synthesis API for native Mandarin audio pronunciation.
          </p>
        </div>
      </div>
    </div>
  );
};



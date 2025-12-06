/**
 * Компонент системы табов
 * Поддержка keyboard navigation, responsive дизайн, анимации
 */

import { useCallback, useEffect, useRef } from 'preact/hooks';
import { useLanguage } from '../contexts/LanguageContext.tsx';

export type TabId = 'search' | 'base' | 'battle' | 'chat' | 'admin';

export interface TabItem {
  id: TabId;
  labelKey: string;
  icon: string;
}

export const TAB_ITEMS: TabItem[] = [
  { id: 'search', labelKey: 'tabs.smartSearch', icon: '🔍' },
  { id: 'base', labelKey: 'tabs.base', icon: '📚' },
  { id: 'battle', labelKey: 'tabs.battle', icon: '⚔️' },
  { id: 'chat', labelKey: 'tabs.chat', icon: '💬' },
  { id: 'admin', labelKey: 'tabs.admin', icon: '⚙️' },
];

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

/**
 * Компонент горизонтальной навигации табов
 * @param activeTab - Текущий активный таб
 * @param onTabChange - Callback для смены таба
 * @param mobileMenuOpen - Открыто ли мобильное меню
 * @param onMobileMenuToggle - Callback для toggle мобильного меню
 */
export const Tabs = ({
  activeTab,
  onTabChange,
  mobileMenuOpen = false,
  onMobileMenuToggle,
}: TabsProps) => {
  const tabsRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const currentIndex = TAB_ITEMS.findIndex((tab) => tab.id === activeTab);
      
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % TAB_ITEMS.length;
        onTabChange(TAB_ITEMS[nextIndex].id);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? TAB_ITEMS.length - 1 : currentIndex - 1;
        onTabChange(TAB_ITEMS[prevIndex].id);
      }
    },
    [activeTab, onTabChange]
  );

  useEffect(() => {
    const tabsEl = tabsRef.current;
    if (tabsEl) {
      tabsEl.addEventListener('keydown', handleKeyDown);
      return () => tabsEl.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown]);

  return (
    <>
      {/* Desktop Tabs */}
      <nav
        ref={tabsRef}
        class="hidden md:flex items-center bg-dark-800 border-b border-dark-600"
        role="tablist"
        tabIndex={0}
      >
        {TAB_ITEMS.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            label={t(tab.labelKey)}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <div class="md:hidden flex items-center justify-between bg-dark-800 border-b border-dark-600 px-4 py-3">
        <span class="font-medium text-white">
          {TAB_ITEMS.find((tab) => tab.id === activeTab)?.icon}{' '}
          {t(TAB_ITEMS.find((tab) => tab.id === activeTab)?.labelKey || '')}
        </span>
        <button
          type="button"
          onClick={onMobileMenuToggle}
          class="p-2 rounded-lg hover:bg-dark-700 transition-colors"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <svg
            class={`w-6 h-6 text-gray-400 transition-transform duration-200 ${
              mobileMenuOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width={2}
              d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        class={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav class="bg-dark-800 border-b border-dark-600 py-2 px-4 space-y-1">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onTabChange(tab.id);
                onMobileMenuToggle?.();
              }}
              class={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-cyber-500/10 text-cyber-400 border border-cyber-500/30'
                  : 'text-gray-400 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <span class="text-xl">{tab.icon}</span>
              <span class="font-medium">{t(tab.labelKey)}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
};

interface TabButtonProps {
  tab: TabItem;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Отдельная кнопка таба - тёмная тема
 */
const TabButton = ({ tab, label, isActive, onClick }: TabButtonProps) => (
  <button
    type="button"
    role="tab"
    aria-selected={isActive}
    onClick={onClick}
    class={`relative flex-1 flex items-center justify-center gap-2 px-4 py-4 font-medium transition-all duration-200 border-r border-dark-600 last:border-r-0 ${
      isActive
        ? 'text-cyber-400 bg-cyber-500/10'
        : 'text-gray-400 hover:text-white hover:bg-dark-700'
    }`}
  >
    <span class="text-lg">{tab.icon}</span>
    <span>{label}</span>
    {/* Active indicator - cyber glow */}
    <span
      class={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyber-400 to-cyber-600 transition-all duration-300 ${
        isActive ? 'opacity-100 scale-x-100 shadow-glow-sm' : 'opacity-0 scale-x-0'
      }`}
    />
  </button>
);

export default Tabs;

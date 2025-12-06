/**
 * Компонент системы табов
 * Поддержка keyboard navigation, responsive дизайн, анимации
 */

import { useCallback, useEffect, useRef } from 'preact/hooks';

export type TabId = 'search' | 'base' | 'battle' | 'chat' | 'admin';

export interface TabItem {
  id: TabId;
  label: string;
  icon: string;
}

export const TABS: TabItem[] = [
  { id: 'search', label: 'Умный поиск', icon: '🔍' },
  { id: 'base', label: 'База', icon: '📚' },
  { id: 'battle', label: 'Батл', icon: '⚔️' },
  { id: 'chat', label: 'Чат', icon: '💬' },
  { id: 'admin', label: 'Админ', icon: '⚙️' },
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

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const currentIndex = TABS.findIndex((t) => t.id === activeTab);
      
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % TABS.length;
        onTabChange(TABS[nextIndex].id);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? TABS.length - 1 : currentIndex - 1;
        onTabChange(TABS[prevIndex].id);
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
        class="hidden md:flex items-center justify-center gap-1 bg-white border-b border-gray-200 px-4"
        role="tablist"
        tabIndex={0}
      >
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <div class="md:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
        <span class="font-medium text-gray-900">
          {TABS.find((t) => t.id === activeTab)?.icon}{' '}
          {TABS.find((t) => t.id === activeTab)?.label}
        </span>
        <button
          type="button"
          onClick={onMobileMenuToggle}
          class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <svg
            class={`w-6 h-6 text-gray-600 transition-transform duration-200 ${
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
        <nav class="bg-white border-b border-gray-200 py-2 px-4 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onTabChange(tab.id);
                onMobileMenuToggle?.();
              }}
              class={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span class="text-xl">{tab.icon}</span>
              <span class="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
};

interface TabButtonProps {
  tab: TabItem;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Отдельная кнопка таба
 */
const TabButton = ({ tab, isActive, onClick }: TabButtonProps) => (
  <button
    type="button"
    role="tab"
    aria-selected={isActive}
    onClick={onClick}
    class={`relative flex items-center gap-2 px-4 py-4 font-medium transition-all duration-200 ${
      isActive
        ? 'text-blue-600'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    <span class="text-lg">{tab.icon}</span>
    <span>{tab.label}</span>
    {/* Active indicator */}
    <span
      class={`absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 transition-all duration-300 ${
        isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
      }`}
    />
  </button>
);

export default Tabs;

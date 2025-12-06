/**
 * Главный island компонент с tab-навигацией
 * Управляет состоянием табов и сохранением в localStorage
 */

import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { MainLayout } from '../src/components/MainLayout.tsx';
import { TabPanel } from '../src/components/TabPanel.tsx';
import type { TabId } from '../src/components/Tabs.tsx';
import { SmartSearchTab } from '../src/components/tabs/SmartSearchTab.tsx';
import { UniversityBaseTab } from '../src/components/tabs/UniversityBaseTab.tsx';
import { BattleTab } from '../src/components/tabs/BattleTab.tsx';
import { ChatBotTab } from '../src/components/tabs/ChatBotTab.tsx';
import { AdminTab } from '../src/components/tabs/AdminTab.tsx';
import { LanguageProvider } from '../src/contexts/LanguageContext.tsx';

const STORAGE_KEY = 'activeTab';
const VALID_TABS: TabId[] = ['search', 'base', 'battle', 'chat', 'admin'];

/**
 * Главный island с tab-based интерфейсом
 * Сохраняет состояние таба в localStorage
 */
export default function MainPage() {
  const activeTab = useSignal<TabId>('search');
  const mobileMenuOpen = useSignal(false);
  const isInitialized = useSignal(false);

  // Восстановление сохранённого таба из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && VALID_TABS.includes(saved as TabId)) {
        activeTab.value = saved as TabId;
      }
    } catch {
      // localStorage недоступен
    }
    isInitialized.value = true;
  }, []);

  // Сохранение таба в localStorage при изменении
  useEffect(() => {
    if (!isInitialized.value) return;
    try {
      localStorage.setItem(STORAGE_KEY, activeTab.value);
    } catch {
      // localStorage недоступен
    }
  }, [activeTab.value, isInitialized.value]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + число для быстрого переключения
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const index = parseInt(e.key, 10) - 1;
        if (index < VALID_TABS.length) {
          activeTab.value = VALID_TABS[index];
        }
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTabChange = (tab: TabId) => {
    activeTab.value = tab;
    mobileMenuOpen.value = false;
  };

  const handleMobileMenuToggle = () => {
    mobileMenuOpen.value = !mobileMenuOpen.value;
  };

  return (
    <LanguageProvider>
      <MainLayout
        activeTab={activeTab.value}
        onTabChange={handleTabChange}
        mobileMenuOpen={mobileMenuOpen.value}
        onMobileMenuToggle={handleMobileMenuToggle}
      >
        {/* Tab Panels with animations */}
        <div class="flex-1 flex flex-col">
          <TabPanel id="search" isActive={activeTab.value === 'search'}>
            <SmartSearchTab />
          </TabPanel>

          <TabPanel id="base" isActive={activeTab.value === 'base'}>
            <UniversityBaseTab />
          </TabPanel>

          <TabPanel id="battle" isActive={activeTab.value === 'battle'}>
            <BattleTab />
          </TabPanel>

          <TabPanel id="chat" isActive={activeTab.value === 'chat'}>
            <ChatBotTab />
          </TabPanel>

          <TabPanel id="admin" isActive={activeTab.value === 'admin'}>
            <AdminTab />
          </TabPanel>
        </div>
      </MainLayout>
    </LanguageProvider>
  );
}

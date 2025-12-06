/**
 * Главный layout компонент с header, табами и footer
 */

import type { ComponentChildren } from 'preact';
import { Tabs, type TabId } from './Tabs.tsx';
import { LanguageSwitcher, useLanguage } from '../contexts/LanguageContext.tsx';

interface MainLayoutProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  mobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
  children: ComponentChildren;
}

/**
 * Главный layout с header, tab-навигацией и footer
 * @param activeTab - Текущий активный таб
 * @param onTabChange - Callback смены таба
 * @param mobileMenuOpen - Состояние мобильного меню
 * @param onMobileMenuToggle - Toggle мобильного меню
 * @param children - Содержимое (tab panels)
 */
export const MainLayout = ({
  activeTab,
  onTabChange,
  mobileMenuOpen,
  onMobileMenuToggle,
  children,
}: MainLayoutProps) => {
  const { t } = useLanguage();

  return (
    <div class="min-h-screen flex flex-col bg-dark-900 bg-grid">
      {/* Header */}
      <header class="bg-dark-800/90 backdrop-blur-md border-b border-dark-600 sticky top-0 z-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div class="flex justify-between items-center">
            {/* Logo */}
            <a href="/" class="flex items-center gap-3 group">
              <div class="w-10 h-10 bg-gradient-to-br from-cyber-400 to-cyber-600 rounded-lg flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-all">
                <span class="text-xl">🎓</span>
              </div>
              <div class="flex flex-col">
                <span class="font-bold text-lg text-white">{t('common.appTitle')}</span>
                <span class="text-xs text-cyber-400 -mt-1 hidden sm:block">AI-платформа</span>
              </div>
            </a>
            
            {/* Language Selector */}
            <div class="flex items-center gap-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <Tabs
        activeTab={activeTab}
        onTabChange={onTabChange}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={onMobileMenuToggle}
      />

      {/* Main Content Area */}
      <main class="flex-1 flex flex-col">{children}</main>

      {/* Footer */}
      <footer class="bg-dark-800/50 border-t border-dark-600 py-4">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
            <div class="flex items-center gap-2">
              <span class="text-cyber-400">⚡</span>
              <span>{t('footer.copyright')}</span>
            </div>
            <p class="text-gray-600">{t('footer.dataUpdated')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

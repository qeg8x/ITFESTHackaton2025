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
    <div class="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header class="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div class="flex justify-between items-center">
            {/* Logo */}
            <a href="/" class="flex items-center gap-2 group">
              <span class="text-2xl group-hover:scale-110 transition-transform">🎓</span>
              <span class="font-bold text-xl text-gray-900">{t('common.appTitle')}</span>
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
      <footer class="bg-white border-t border-gray-200 py-4">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-500">
            <div class="flex items-center gap-2">
              <span>🎓</span>
              <span>{t('footer.copyright')}</span>
            </div>
            <p>{t('footer.dataUpdated')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

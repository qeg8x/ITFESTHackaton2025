/**
 * Главный layout компонент с header, табами и footer
 */

import type { ComponentChildren } from 'preact';
import { Tabs, type TabId } from './Tabs.tsx';

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
  return (
    <div class="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header class="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div class="flex justify-between items-center">
            {/* Logo */}
            <a href="/" class="flex items-center gap-2 group">
              <span class="text-2xl group-hover:scale-110 transition-transform">🎓</span>
              <span class="font-bold text-xl text-gray-900">Цифровой университет</span>
            </a>
            
            {/* Language Selector (placeholder) */}
            <div class="flex items-center gap-4">
              <button
                type="button"
                class="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span>🌐</span>
                <span class="hidden sm:inline">RU</span>
              </button>
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
              <span>Цифровой университет © 2025</span>
            </div>
            <p>Данные обновляются автоматически с помощью AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

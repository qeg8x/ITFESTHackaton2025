/**
 * Контейнер для функции "Админ"
 * Встроенная админ-панель или редирект
 */

import { useLanguage } from '../../contexts/LanguageContext.tsx';

/**
 * Tab контейнер для админ-панели
 * Предоставляет быстрый доступ к административным функциям
 */
export const AdminTab = () => {
  const { t } = useLanguage();
  
  const adminFeatures = [
    {
      titleKey: 'admin.universities',
      descKey: 'admin.universitiesDesc',
      icon: '🏫',
      href: '/admin/universities',
    },
    {
      titleKey: 'admin.logs',
      descKey: 'admin.logsDesc',
      icon: '📋',
      href: '/admin/logs',
    },
    {
      titleKey: 'admin.parser',
      descKey: 'admin.parserDesc',
      icon: '🔄',
      href: '/admin/parser',
    },
    {
      titleKey: 'admin.settings',
      descKey: 'admin.settingsDesc',
      icon: '⚙️',
      href: '/admin/settings',
    },
  ];

  return (
    <div class="h-full flex flex-col bg-dark-900">
      {/* Header */}
      <div class="bg-gradient-to-b from-dark-800 to-dark-900 py-8 px-4 text-center">
        <h1 class="text-2xl md:text-3xl font-bold text-white mb-2">
          ⚙️ {t('admin.title')}
        </h1>
        <p class="text-gray-400">
          {t('admin.subtitle')}
        </p>
      </div>

      {/* Quick Actions */}
      <div class="flex-1 p-4">
        <div class="max-w-4xl mx-auto">
          {/* Warning */}
          <div class="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3">
            <span class="text-xl">⚠️</span>
            <div>
              <p class="font-medium text-yellow-400">{t('admin.authRequired')}</p>
              <p class="text-sm text-yellow-500/80 mt-1">
                {t('admin.fullPanel')}
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <div class="grid md:grid-cols-2 gap-4">
            {adminFeatures.map((feature) => (
              <a
                key={feature.href}
                href={feature.href}
                class="block p-6 bg-dark-800 border border-dark-600 rounded-xl hover:border-cyber-500/50 hover:shadow-glow transition-all duration-200 group"
              >
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-dark-700 rounded-xl flex items-center justify-center group-hover:bg-cyber-500/20 transition-colors">
                    <span class="text-2xl">{feature.icon}</span>
                  </div>
                  <div class="flex-1">
                    <h3 class="font-semibold text-white group-hover:text-cyber-400 transition-colors">
                      {t(feature.titleKey)}
                    </h3>
                    <p class="text-sm text-gray-500 mt-1">{t(feature.descKey)}</p>
                  </div>
                  <span class="text-gray-500 group-hover:text-cyber-400 transition-colors">
                    →
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Full Admin Link */}
          <div class="mt-8 text-center">
            <a
              href="/admin"
              class="inline-flex items-center gap-2 px-6 py-3 bg-cyber-500 text-dark-900 font-semibold rounded-xl hover:bg-cyber-400 hover:shadow-glow transition-all"
            >
              <span>{t('admin.fullPanel')}</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTab;

/**
 * Контейнер для функции "Умный поиск"
 * Объединяет поиск существующих университетов и добавление новых
 */

import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import UniversitySearch from '../../../islands/UniversitySearch.tsx';

interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  programs_count: number;
  completeness: number;
}

/**
 * Tab контейнер для умного AI-поиска университетов
 */
export const SmartSearchTab = () => {
  const universities = useSignal<University[]>([]);
  const loading = useSignal(true);

  // Загрузить последние университеты
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await fetch('/api/universities?limit=12');
        if (response.ok) {
          const data = await response.json();
          universities.value = data.data || [];
        }
      } catch {
        // ignore
      } finally {
        loading.value = false;
      }
    };
    fetchUniversities();
  }, []);

  return (
    <div class="h-full flex flex-col overflow-y-auto scrollbar-thin">
      {/* Hero Section */}
      <div class="bg-gradient-to-b from-dark-800 to-dark-900 py-10 md:py-12 relative">
        <div class="absolute inset-0 bg-grid opacity-50" />
        <div class="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h1 class="text-2xl md:text-3xl font-bold text-white mb-3">
            Найдите свой <span class="text-gradient">идеальный</span> университет
          </h1>
          <p class="text-gray-400 mb-6 max-w-xl mx-auto">
            Поиск в базе или добавление нового через AI
          </p>
          
          {/* Search Component */}
          <div class="max-w-2xl mx-auto">
            <UniversitySearch />
          </div>
        </div>
      </div>

      {/* Universities List */}
      <div class="flex-1 py-8 px-4 bg-dark-900">
        <div class="max-w-5xl mx-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-white flex items-center gap-2">
              <span class="text-cyber-400">📚</span> Университеты в базе
              {!loading.value && (
                <span class="ml-2 text-sm font-normal text-gray-500">
                  ({universities.value.length})
                </span>
              )}
            </h2>
          </div>

          {loading.value ? (
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} class="bg-dark-800 rounded-xl p-4 border border-dark-600 animate-shimmer">
                  <div class="h-5 bg-dark-700 rounded w-3/4 mb-2" />
                  <div class="h-4 bg-dark-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : universities.value.length > 0 ? (
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {universities.value.map((uni) => (
                <a
                  key={uni.id}
                  href={`/universities/${uni.id}`}
                  class="bg-dark-800 rounded-xl p-4 border border-dark-600 hover:border-cyber-500/50 hover:shadow-glow transition-all group"
                >
                  <h3 class="font-semibold text-white group-hover:text-cyber-400 line-clamp-2 transition-colors">
                    {uni.name}
                  </h3>
                  <p class="text-sm text-gray-500 mt-1">
                    📍 {uni.country}, {uni.city}
                  </p>
                  <div class="flex items-center gap-3 mt-3 text-xs text-gray-500">
                    <span>{uni.programs_count} программ</span>
                    <span class="flex items-center gap-1">
                      <div 
                        class="w-12 h-1.5 bg-dark-600 rounded-full overflow-hidden"
                      >
                        <div 
                          class="h-full bg-gradient-to-r from-cyber-500 to-matrix-500 rounded-full"
                          style={{ width: `${uni.completeness}%` }}
                        />
                      </div>
                      {uni.completeness}%
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div class="text-center py-12 text-gray-500">
              <span class="text-4xl">📭</span>
              <p class="mt-4">База пуста. Используйте поиск выше для добавления университетов.</p>
            </div>
          )}
        </div>
      </div>

      {/* How it works - compact */}
      <div class="py-8 px-4 border-t border-dark-600 bg-dark-800">
        <div class="max-w-4xl mx-auto">
          <div class="grid md:grid-cols-3 gap-6 text-center">
            <div class="flex items-center gap-3 md:flex-col md:gap-2">
              <div class="w-10 h-10 bg-cyber-500/20 border border-cyber-500/30 rounded-lg flex items-center justify-center">
                <span class="text-xl">🔍</span>
              </div>
              <div class="text-left md:text-center">
                <h3 class="font-medium text-sm text-white">Поиск</h3>
                <p class="text-xs text-gray-500">В базе данных</p>
              </div>
            </div>
            <div class="flex items-center gap-3 md:flex-col md:gap-2">
              <div class="w-10 h-10 bg-neon-500/20 border border-neon-500/30 rounded-lg flex items-center justify-center">
                <span class="text-xl">🤖</span>
              </div>
              <div class="text-left md:text-center">
                <h3 class="font-medium text-sm text-white">AI-проверка</h3>
                <p class="text-xs text-gray-500">Если нет в базе</p>
              </div>
            </div>
            <div class="flex items-center gap-3 md:flex-col md:gap-2">
              <div class="w-10 h-10 bg-matrix-500/20 border border-matrix-500/30 rounded-lg flex items-center justify-center">
                <span class="text-xl">➕</span>
              </div>
              <div class="text-left md:text-center">
                <h3 class="font-medium text-sm text-white">Добавление</h3>
                <p class="text-xs text-gray-500">Автоматический парсинг</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSearchTab;

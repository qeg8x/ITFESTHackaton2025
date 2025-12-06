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
    <div class="h-full flex flex-col overflow-y-auto">
      {/* Hero Section */}
      <div class="bg-gradient-to-b from-blue-50 to-white py-10 md:py-12">
        <div class="max-w-4xl mx-auto px-4 text-center">
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Найдите свой <span class="text-blue-600">идеальный</span> университет
          </h1>
          <p class="text-gray-600 mb-6 max-w-xl mx-auto">
            Поиск в базе или добавление нового через AI
          </p>
          
          {/* Search Component */}
          <div class="max-w-2xl mx-auto">
            <UniversitySearch />
          </div>
        </div>
      </div>

      {/* Universities List */}
      <div class="flex-1 py-8 px-4 bg-gray-50">
        <div class="max-w-5xl mx-auto">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-lg font-semibold text-gray-900">
              📚 Университеты в базе
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
                <div key={i} class="bg-white rounded-xl p-4 border animate-pulse">
                  <div class="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                  <div class="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : universities.value.length > 0 ? (
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {universities.value.map((uni) => (
                <a
                  key={uni.id}
                  href={`/universities/${uni.id}`}
                  class="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <h3 class="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2">
                    {uni.name}
                  </h3>
                  <p class="text-sm text-gray-500 mt-1">
                    📍 {uni.country}, {uni.city}
                  </p>
                  <div class="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span>{uni.programs_count} программ</span>
                    <span class="flex items-center gap-1">
                      <div 
                        class="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden"
                      >
                        <div 
                          class="h-full bg-green-500 rounded-full"
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
      <div class="py-8 px-4 border-t border-gray-200 bg-white">
        <div class="max-w-4xl mx-auto">
          <div class="grid md:grid-cols-3 gap-6 text-center">
            <div class="flex items-center gap-3 md:flex-col md:gap-2">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span class="text-xl">🔍</span>
              </div>
              <div class="text-left md:text-center">
                <h3 class="font-medium text-sm">Поиск</h3>
                <p class="text-xs text-gray-500">В базе данных</p>
              </div>
            </div>
            <div class="flex items-center gap-3 md:flex-col md:gap-2">
              <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span class="text-xl">🤖</span>
              </div>
              <div class="text-left md:text-center">
                <h3 class="font-medium text-sm">AI-проверка</h3>
                <p class="text-xs text-gray-500">Если нет в базе</p>
              </div>
            </div>
            <div class="flex items-center gap-3 md:flex-col md:gap-2">
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span class="text-xl">➕</span>
              </div>
              <div class="text-left md:text-center">
                <h3 class="font-medium text-sm">Добавление</h3>
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

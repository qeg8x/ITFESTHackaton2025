/**
 * Контейнер для функции "База"
 * Список университетов с фильтрами
 */

import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';

interface University {
  id: string;
  name: string;
  name_en?: string;
  country: string;
  city: string;
  programs_count: number;
  completeness: number;
}

interface Filters {
  country: string;
  search: string;
}

/**
 * Tab контейнер для базы университетов с фильтрами
 */
export const UniversityBaseTab = () => {
  const universities = useSignal<University[]>([]);
  const loading = useSignal(true);
  const filters = useSignal<Filters>({ country: '', search: '' });
  const countries = useSignal<string[]>([]);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        loading.value = true;
        const response = await fetch('/api/universities?limit=100');
        if (response.ok) {
          const data = await response.json();
          universities.value = data.data || [];
          
          // Extract unique countries
          const uniqueCountries = [...new Set(universities.value.map((u) => u.country))];
          countries.value = uniqueCountries.sort();
        }
      } catch {
        // ignore
      } finally {
        loading.value = false;
      }
    };
    fetchUniversities();
  }, []);

  const filteredUniversities = universities.value.filter((u) => {
    const matchesCountry = !filters.value.country || u.country === filters.value.country;
    const matchesSearch =
      !filters.value.search ||
      u.name.toLowerCase().includes(filters.value.search.toLowerCase()) ||
      (u.name_en && u.name_en.toLowerCase().includes(filters.value.search.toLowerCase()));
    return matchesCountry && matchesSearch;
  });

  return (
    <div class="h-full flex flex-col bg-dark-900">
      {/* Filters */}
      <div class="bg-dark-800 border-b border-dark-600 p-4">
        <div class="max-w-6xl mx-auto">
          <div class="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div class="flex-1">
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={filters.value.search}
                onInput={(e) => {
                  filters.value = {
                    ...filters.value,
                    search: (e.target as HTMLInputElement).value,
                  };
                }}
                class="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-cyber-500/20 focus:border-cyber-500 outline-none placeholder:text-gray-500 transition-all"
              />
            </div>

            {/* Country Filter */}
            <div class="sm:w-48">
              <select
                value={filters.value.country}
                onChange={(e) => {
                  filters.value = {
                    ...filters.value,
                    country: (e.target as HTMLSelectElement).value,
                  };
                }}
                class="w-full px-4 py-2.5 bg-dark-700 border border-dark-600 text-white rounded-lg focus:ring-2 focus:ring-cyber-500/20 focus:border-cyber-500 outline-none transition-all"
              >
                <option value="">Все страны</option>
                {countries.value.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div class="mt-3 text-sm text-gray-500">
            Найдено: <span class="text-cyber-400">{filteredUniversities.length}</span> из {universities.value.length}
          </div>
        </div>
      </div>

      {/* Universities List */}
      <div class="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <div class="max-w-6xl mx-auto">
          {loading.value ? (
            <div class="flex items-center justify-center py-12">
              <div class="animate-spin w-8 h-8 border-4 border-cyber-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredUniversities.length === 0 ? (
            <div class="text-center py-12">
              <span class="text-4xl">📚</span>
              <p class="mt-4 text-gray-500">Университеты не найдены</p>
            </div>
          ) : (
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUniversities.map((uni) => (
                <UniversityCard key={uni.id} university={uni} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface UniversityCardProps {
  university: University;
}

/**
 * Карточка университета - тёмная тема
 */
const UniversityCard = ({ university }: UniversityCardProps) => (
  <a
    href={`/universities/${university.id}`}
    class="block p-4 bg-dark-800 border border-dark-600 rounded-xl hover:border-cyber-500/50 hover:shadow-glow transition-all duration-200 group"
  >
    <h3 class="font-semibold text-white mb-2 line-clamp-2 group-hover:text-cyber-400 transition-colors">{university.name}</h3>
    {university.name_en && (
      <p class="text-sm text-gray-500 mb-2 line-clamp-1">{university.name_en}</p>
    )}
    <div class="flex items-center gap-2 text-sm text-gray-400">
      <span>📍</span>
      <span>
        {university.country}, {university.city}
      </span>
    </div>
    <div class="mt-3 flex items-center justify-between">
      <span class="text-sm text-gray-500">
        {university.programs_count} программ
      </span>
      <div class="flex items-center gap-1">
        <div class="w-16 h-1.5 bg-dark-600 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-cyber-500 to-matrix-500 rounded-full"
            style={{ width: `${university.completeness}%` }}
          />
        </div>
        <span class="text-xs text-gray-500">{university.completeness}%</span>
      </div>
    </div>
  </a>
);

export default UniversityBaseTab;

/**
 * Компонент списка университетов с фильтрами
 * Включает FilterPanel, список результатов и пагинацию
 */

import { useSignal } from '@preact/signals';
import { useCallback, useEffect } from 'preact/hooks';
import { UniversityFilters, DEFAULT_FILTERS, type Filters } from './UniversityFilters.tsx';

/**
 * Университет из результатов фильтрации
 */
interface FilteredUniversity {
  id: string;
  name: string;
  name_en: string | null;
  country: string;
  city: string;
  specializations: string[];
  languages: string[];
  degree_levels: string[];
  min_tuition: number | null;
  max_tuition: number | null;
  size_category: string | null;
  accepts_international: boolean;
}

/**
 * Ответ API
 */
interface FilterResponse {
  results: FilteredUniversity[];
  total: number;
  filters_applied: Record<string, unknown>;
  pagination: {
    limit: number;
    offset: number;
  };
  cache_hit: boolean;
}

interface UniversityListWithFiltersProps {
  initialFilters?: Partial<Filters>;
}

/**
 * Главный компонент списка с фильтрами
 */
export const UniversityListWithFilters = ({
  initialFilters,
}: UniversityListWithFiltersProps) => {
  const filters = useSignal<Filters>({ ...DEFAULT_FILTERS, ...initialFilters });
  const results = useSignal<FilteredUniversity[]>([]);
  const total = useSignal(0);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const page = useSignal(0);
  const limit = 20;

  // Загрузка данных
  const fetchData = useCallback(async () => {
    loading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams();

      if (filters.value.country) {
        params.set('country', filters.value.country);
      }
      if (filters.value.specializations.length > 0) {
        params.set('specialization', filters.value.specializations.join(','));
      }
      if (filters.value.languages.length > 0) {
        params.set('language', filters.value.languages.join(','));
      }
      if (filters.value.degree_levels.length > 0) {
        params.set('degree_level', filters.value.degree_levels.join(','));
      }
      if (filters.value.min_tuition > 0) {
        params.set('min_tuition', filters.value.min_tuition.toString());
      }
      if (filters.value.max_tuition < 100000) {
        params.set('max_tuition', filters.value.max_tuition.toString());
      }
      if (filters.value.accepts_international !== null) {
        params.set('accepts_international', filters.value.accepts_international.toString());
      }
      if (filters.value.size_category) {
        params.set('size', filters.value.size_category);
      }

      params.set('limit', limit.toString());
      params.set('offset', (page.value * limit).toString());

      const response = await fetch(`/api/universities/filtered?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch universities');
      }

      const data: FilterResponse = await response.json();
      results.value = data.results;
      total.value = data.total;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      results.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  }, []);

  // Загрузка при изменении фильтров или страницы
  useEffect(() => {
    fetchData();
  }, [filters.value, page.value]);

  // Обработчики
  const handleFilterChange = (newFilters: Filters) => {
    filters.value = newFilters;
    page.value = 0; // Сброс на первую страницу
  };

  const handleReset = () => {
    filters.value = { ...DEFAULT_FILTERS };
    page.value = 0;
  };

  const totalPages = Math.ceil(total.value / limit);

  return (
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">База университетов</h1>
          <p class="text-gray-600 mt-1">
            Найдено: {total.value} университетов
          </p>
        </div>

        <div class="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div class="lg:col-span-1">
            <div class="sticky top-4">
              <UniversityFilters
                filters={filters.value}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
                loading={loading.value}
              />
            </div>
          </div>

          {/* Results */}
          <div class="lg:col-span-3">
            {/* Loading State */}
            {loading.value && (
              <div class="flex items-center justify-center py-12">
                <div class="flex items-center gap-3">
                  <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span class="text-gray-600">Загрузка...</span>
                </div>
              </div>
            )}

            {/* Error State */}
            {error.value && !loading.value && (
              <div class="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                <span class="text-2xl">❌</span>
                <p class="mt-2 text-red-700">{error.value}</p>
                <button
                  type="button"
                  onClick={fetchData}
                  class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Попробовать снова
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading.value && !error.value && results.value.length === 0 && (
              <EmptyState onReset={handleReset} />
            )}

            {/* Results Grid */}
            {!loading.value && !error.value && results.value.length > 0 && (
              <>
                <div class="grid gap-4 md:grid-cols-2">
                  {results.value.map((uni) => (
                    <UniversityCard key={uni.id} university={uni} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={page.value}
                    totalPages={totalPages}
                    onPageChange={(p) => { page.value = p; }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface UniversityCardProps {
  university: FilteredUniversity;
}

/**
 * Карточка университета
 */
const UniversityCard = ({ university }: UniversityCardProps) => {
  const specializations = Array.isArray(university.specializations)
    ? university.specializations
    : [];
  const languages = Array.isArray(university.languages)
    ? university.languages
    : [];

  return (
    <a
      href={`/universities/${university.id}`}
      class="block p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {university.name}
          </h3>
          {university.name_en && (
            <p class="text-sm text-gray-500 truncate">{university.name_en}</p>
          )}
        </div>
        {university.accepts_international && (
          <span class="text-lg" title="Принимает иностранных студентов">🌍</span>
        )}
      </div>

      <p class="text-sm text-gray-600 mt-2 flex items-center gap-1">
        <span>📍</span>
        {university.country}, {university.city}
      </p>

      {/* Specializations */}
      {specializations.length > 0 && (
        <div class="flex flex-wrap gap-1 mt-3">
          {specializations.slice(0, 3).map((spec) => (
            <span
              key={spec}
              class="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"
            >
              {spec}
            </span>
          ))}
          {specializations.length > 3 && (
            <span class="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
              +{specializations.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <p class="text-xs text-gray-500 mt-2">
          🗣️ {languages.join(', ')}
        </p>
      )}

      {/* Tuition */}
      {university.min_tuition !== null && (
        <p class="text-xs text-gray-500 mt-1">
          💰 от ${university.min_tuition?.toLocaleString()}
          {university.max_tuition && ` до $${university.max_tuition.toLocaleString()}`}
          /год
        </p>
      )}
    </a>
  );
};

interface EmptyStateProps {
  onReset: () => void;
}

/**
 * Пустое состояние (нет результатов)
 */
const EmptyState = ({ onReset }: EmptyStateProps) => (
  <div class="p-12 bg-white border border-gray-200 rounded-xl text-center">
    <span class="text-5xl">🔍</span>
    <h3 class="mt-4 text-lg font-semibold text-gray-900">
      Университеты не найдены
    </h3>
    <p class="mt-2 text-gray-600">
      Попробуйте изменить или сбросить фильтры
    </p>
    <button
      type="button"
      onClick={onReset}
      class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Сбросить фильтры
    </button>
  </div>
);

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Компонент пагинации
 */
const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages, start + maxVisible);

  if (end - start < maxVisible) {
    start = Math.max(0, end - maxVisible);
  }

  for (let i = start; i < end; i++) {
    pages.push(i);
  }

  return (
    <div class="flex items-center justify-center gap-2 mt-6">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ← Назад
      </button>

      {start > 0 && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(0)}
            class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            1
          </button>
          {start > 1 && <span class="text-gray-400">...</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          class={`px-3 py-2 text-sm border rounded-lg transition-colors ${
            p === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          {p + 1}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span class="text-gray-400">...</span>}
          <button
            type="button"
            onClick={() => onPageChange(totalPages - 1)}
            class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        class="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Вперёд →
      </button>
    </div>
  );
};

export default UniversityListWithFilters;

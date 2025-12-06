/**
 * Компонент выбора университетов для сравнения
 */

import { useSignal } from '@preact/signals';
import { useCallback } from 'preact/hooks';

interface University {
  id: string;
  name: string;
  country: string;
}

interface BattleSelectorProps {
  onCompare: (id1: string, id2: string) => void;
  loading?: boolean;
}

/**
 * Селектор университетов для Battle Mode
 */
export const BattleSelector = ({ onCompare, loading = false }: BattleSelectorProps) => {
  const universityA = useSignal<University | null>(null);
  const universityB = useSignal<University | null>(null);
  const searchA = useSignal('');
  const searchB = useSignal('');
  const resultsA = useSignal<University[]>([]);
  const resultsB = useSignal<University[]>([]);
  const loadingA = useSignal(false);
  const loadingB = useSignal(false);

  // Поиск университетов
  const searchUniversities = useCallback(async (query: string, side: 'A' | 'B') => {
    if (query.length < 2) {
      if (side === 'A') resultsA.value = [];
      else resultsB.value = [];
      return;
    }

    const loadingSignal = side === 'A' ? loadingA : loadingB;
    const resultsSignal = side === 'A' ? resultsA : resultsB;

    loadingSignal.value = true;

    try {
      const response = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        resultsSignal.value = data.results.filter((r: { found_in_db: boolean }) => r.found_in_db);
      }
    } catch {
      resultsSignal.value = [];
    } finally {
      loadingSignal.value = false;
    }
  }, []);

  // Выбор университета
  const selectUniversity = (uni: University, side: 'A' | 'B') => {
    if (side === 'A') {
      universityA.value = uni;
      searchA.value = uni.name;
      resultsA.value = [];
    } else {
      universityB.value = uni;
      searchB.value = uni.name;
      resultsB.value = [];
    }
  };

  // Обработка сравнения
  const handleCompare = () => {
    if (universityA.value && universityB.value) {
      onCompare(universityA.value.id, universityB.value.id);
    }
  };

  const canCompare = universityA.value && universityB.value && !loading;

  return (
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <h2 class="text-xl font-bold text-gray-900 text-center mb-6">
        🏆 Выберите университеты для сравнения
      </h2>

      <div class="grid md:grid-cols-2 gap-6">
        {/* Университет A */}
        <UniversitySearchInput
          label="Первый университет"
          placeholder="Введите название..."
          value={searchA.value}
          onChange={(v) => {
            searchA.value = v;
            searchUniversities(v, 'A');
          }}
          results={resultsA.value}
          loading={loadingA.value}
          selected={universityA.value}
          onSelect={(uni) => selectUniversity(uni, 'A')}
          onClear={() => {
            universityA.value = null;
            searchA.value = '';
          }}
          color="blue"
        />

        {/* VS */}
        <div class="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span class="text-2xl font-bold text-gray-400">VS</span>
        </div>

        {/* Университет B */}
        <UniversitySearchInput
          label="Второй университет"
          placeholder="Введите название..."
          value={searchB.value}
          onChange={(v) => {
            searchB.value = v;
            searchUniversities(v, 'B');
          }}
          results={resultsB.value}
          loading={loadingB.value}
          selected={universityB.value}
          onSelect={(uni) => selectUniversity(uni, 'B')}
          onClear={() => {
            universityB.value = null;
            searchB.value = '';
          }}
          color="red"
        />
      </div>

      {/* Кнопка сравнения */}
      <div class="mt-6 text-center">
        <button
          type="button"
          onClick={handleCompare}
          disabled={!canCompare}
          class={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
            canCompare
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span class="flex items-center gap-2">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Сравниваем...
            </span>
          ) : (
            '⚔️ Сравнить'
          )}
        </button>
      </div>
    </div>
  );
};

interface UniversitySearchInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  results: University[];
  loading: boolean;
  selected: University | null;
  onSelect: (uni: University) => void;
  onClear: () => void;
  color: 'blue' | 'red';
}

/**
 * Поле поиска университета
 */
const UniversitySearchInput = ({
  label,
  placeholder,
  value,
  onChange,
  results,
  loading,
  selected,
  onSelect,
  onClear,
  color,
}: UniversitySearchInputProps) => {
  const borderColor = color === 'blue' ? 'border-blue-500' : 'border-red-500';
  const bgColor = color === 'blue' ? 'bg-blue-50' : 'bg-red-50';

  return (
    <div class="relative">
      <label class="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {selected ? (
        <div class={`p-4 rounded-xl border-2 ${borderColor} ${bgColor}`}>
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-gray-900">{selected.name}</p>
              <p class="text-sm text-gray-500">📍 {selected.country}</p>
            </div>
            <button
              type="button"
              onClick={onClear}
              class="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      ) : (
        <div class="relative">
          <input
            type="text"
            value={value}
            onInput={(e) => onChange((e.target as HTMLInputElement).value)}
            placeholder={placeholder}
            class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />

          {loading && (
            <div class="absolute right-3 top-1/2 -translate-y-1/2">
              <div class="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Dropdown с результатами */}
          {results.length > 0 && (
            <div class="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
              {results.map((uni) => (
                <button
                  key={uni.id}
                  type="button"
                  onClick={() => onSelect(uni)}
                  class="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                >
                  <p class="font-medium text-gray-900">{uni.name}</p>
                  <p class="text-sm text-gray-500">📍 {uni.country}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BattleSelector;

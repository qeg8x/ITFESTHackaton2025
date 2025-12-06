/**
 * Контейнер для функции "Батл"
 * UI для сравнения двух университетов
 */

import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';

interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  programs_count: number;
  tuition_min?: number;
  tuition_max?: number;
  ranking_world?: number;
  completeness: number;
}

interface ComparisonResult {
  category: string;
  uni1Value: string | number;
  uni2Value: string | number;
  winner: 'uni1' | 'uni2' | 'tie';
}

/**
 * Tab контейнер для сравнения (батла) университетов
 */
export const BattleTab = () => {
  const universities = useSignal<University[]>([]);
  const loading = useSignal(true);
  const uni1 = useSignal<University | null>(null);
  const uni2 = useSignal<University | null>(null);
  const searchQuery1 = useSignal('');
  const searchQuery2 = useSignal('');
  const aiComparing = useSignal(false);
  const aiResult = useSignal<{ winner: string; recommendation: string } | null>(null);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await fetch('/api/universities?limit=500');
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

  const filteredUnis1 = universities.value.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery1.value.toLowerCase()) &&
      u.id !== uni2.value?.id
  );

  const filteredUnis2 = universities.value.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery2.value.toLowerCase()) &&
      u.id !== uni1.value?.id
  );

  const comparisons: ComparisonResult[] = uni1.value && uni2.value
    ? [
        {
          category: 'Программы',
          uni1Value: uni1.value.programs_count,
          uni2Value: uni2.value.programs_count,
          winner:
            uni1.value.programs_count > uni2.value.programs_count
              ? 'uni1'
              : uni1.value.programs_count < uni2.value.programs_count
              ? 'uni2'
              : 'tie',
        },
        {
          category: 'Полнота данных',
          uni1Value: `${uni1.value.completeness}%`,
          uni2Value: `${uni2.value.completeness}%`,
          winner:
            uni1.value.completeness > uni2.value.completeness
              ? 'uni1'
              : uni1.value.completeness < uni2.value.completeness
              ? 'uni2'
              : 'tie',
        },
        {
          category: 'Мировой рейтинг',
          uni1Value: uni1.value.ranking_world || 'N/A',
          uni2Value: uni2.value.ranking_world || 'N/A',
          winner:
            uni1.value.ranking_world && uni2.value.ranking_world
              ? uni1.value.ranking_world < uni2.value.ranking_world
                ? 'uni1'
                : uni1.value.ranking_world > uni2.value.ranking_world
                ? 'uni2'
                : 'tie'
              : 'tie',
        },
      ]
    : [];

  return (
    <div class="h-full flex flex-col bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div class="py-8 px-4 text-center">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          ⚔️ Батл университетов
        </h1>
        <p class="text-gray-600">
          Выберите два университета для сравнения
        </p>
      </div>

      {/* Battle Arena */}
      <div class="flex-1 px-4 pb-8">
        <div class="max-w-5xl mx-auto">
          <div class="grid md:grid-cols-2 gap-6">
            {/* University 1 Selector */}
            <UniversitySelector
              label="Первый университет"
              selected={uni1.value}
              searchQuery={searchQuery1.value}
              onSearchChange={(q) => { searchQuery1.value = q; }}
              filteredUniversities={filteredUnis1.slice(0, 5)}
              onSelect={(u) => {
                uni1.value = u;
                searchQuery1.value = '';
                aiResult.value = null;
              }}
              onClear={() => { uni1.value = null; aiResult.value = null; }}
              color="blue"
            />

            {/* University 2 Selector */}
            <UniversitySelector
              label="Второй университет"
              selected={uni2.value}
              searchQuery={searchQuery2.value}
              onSearchChange={(q) => { searchQuery2.value = q; }}
              filteredUniversities={filteredUnis2.slice(0, 5)}
              onSelect={(u) => {
                uni2.value = u;
                searchQuery2.value = '';
                aiResult.value = null;
              }}
              onClear={() => { uni2.value = null; aiResult.value = null; }}
              color="red"
            />
          </div>

          {/* AI Compare Button */}
          {uni1.value && uni2.value && !aiResult.value && (
            <div class="mt-6 text-center">
              <button
                type="button"
                onClick={async () => {
                  if (!uni1.value || !uni2.value) return;
                  aiComparing.value = true;
                  try {
                    const response = await fetch(
                      `/api/universities/compare?id1=${uni1.value.id}&id2=${uni2.value.id}&language=ru`
                    );
                    const data = await response.json();
                    if (data.success && data.result) {
                      aiResult.value = {
                        winner: data.result.overallWinner === 'A' ? uni1.value.name 
                               : data.result.overallWinner === 'B' ? uni2.value.name 
                               : 'Ничья',
                        recommendation: data.result.recommendation || '',
                      };
                    }
                  } catch {
                    // ignore
                  } finally {
                    aiComparing.value = false;
                  }
                }}
                disabled={aiComparing.value}
                class="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
              >
                {aiComparing.value ? (
                  <span class="flex items-center gap-2">
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    AI анализирует...
                  </span>
                ) : (
                  '🤖 AI сравнение'
                )}
              </button>
            </div>
          )}

          {/* AI Result */}
          {aiResult.value && (
            <div class="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
              <div class="text-center">
                <span class="text-3xl">🏆</span>
                <h3 class="text-xl font-bold text-gray-900 mt-2">
                  {aiResult.value.winner}
                </h3>
                {aiResult.value.recommendation && (
                  <p class="text-gray-600 mt-2">{aiResult.value.recommendation}</p>
                )}
              </div>
            </div>
          )}

          {/* Comparison Results */}
          {uni1.value && uni2.value && (
            <div class="mt-8 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div class="bg-gradient-to-r from-blue-600 to-red-600 text-white text-center py-4">
                <h2 class="text-lg font-semibold">Результаты сравнения</h2>
              </div>
              <div class="divide-y divide-gray-100">
                {comparisons.map((comp) => (
                  <div
                    key={comp.category}
                    class="grid grid-cols-3 py-4 px-4 text-center items-center"
                  >
                    <div
                      class={`font-semibold ${
                        comp.winner === 'uni1' ? 'text-blue-600' : 'text-gray-600'
                      }`}
                    >
                      {comp.uni1Value}
                      {comp.winner === 'uni1' && <span class="ml-1">🏆</span>}
                    </div>
                    <div class="text-gray-500 font-medium">{comp.category}</div>
                    <div
                      class={`font-semibold ${
                        comp.winner === 'uni2' ? 'text-red-600' : 'text-gray-600'
                      }`}
                    >
                      {comp.uni2Value}
                      {comp.winner === 'uni2' && <span class="ml-1">🏆</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!uni1.value || !uni2.value) && (
            <div class="mt-8 text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
              <span class="text-4xl">⚔️</span>
              <p class="mt-4 text-gray-500">
                Выберите два университета для начала батла
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface UniversitySelectorProps {
  label: string;
  selected: University | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredUniversities: University[];
  onSelect: (uni: University) => void;
  onClear: () => void;
  color: 'blue' | 'red';
}

/**
 * Компонент выбора университета для батла
 */
const UniversitySelector = ({
  label,
  selected,
  searchQuery,
  onSearchChange,
  filteredUniversities,
  onSelect,
  onClear,
  color,
}: UniversitySelectorProps) => {
  const borderColor = color === 'blue' ? 'border-blue-500' : 'border-red-500';
  const bgColor = color === 'blue' ? 'bg-blue-50' : 'bg-red-50';

  if (selected) {
    return (
      <div class={`p-6 bg-white rounded-2xl border-2 ${borderColor}`}>
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-semibold text-lg text-gray-900">{selected.name}</h3>
            <p class="text-sm text-gray-600 mt-1">
              📍 {selected.country}, {selected.city}
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            class="p-1 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div class="mt-4 flex gap-4 text-sm">
          <span class="text-gray-500">{selected.programs_count} программ</span>
          <span class="text-gray-500">{selected.completeness}% данных</span>
        </div>
      </div>
    );
  }

  return (
    <div class={`p-6 ${bgColor} rounded-2xl border-2 border-dashed ${borderColor}`}>
      <p class="text-sm font-medium text-gray-700 mb-3">{label}</p>
      <input
        type="text"
        placeholder="Поиск университета..."
        value={searchQuery}
        onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
        class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
      />
      {searchQuery && filteredUniversities.length > 0 && (
        <div class="mt-3 space-y-2">
          {filteredUniversities.map((uni) => (
            <button
              key={uni.id}
              type="button"
              onClick={() => onSelect(uni)}
              class="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              <p class="font-medium text-gray-900 text-sm">{uni.name}</p>
              <p class="text-xs text-gray-500">
                {uni.country}, {uni.city}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BattleTab;

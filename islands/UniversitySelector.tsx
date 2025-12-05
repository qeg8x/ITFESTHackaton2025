import { useSignal, useComputed } from '@preact/signals';
import { useEffect } from 'preact/hooks';

/**
 * Университет для списка
 */
interface UniversityItem {
  id: string;
  name: string;
  name_en?: string;
  country: string;
  city: string;
  logo_url?: string;
}

/**
 * Props для селектора университетов
 */
interface UniversitySelectorProps {
  /** Callback при выборе университета */
  onSelect?: (university: UniversityItem) => void;
  /** Перенаправлять на страницу университета */
  navigateOnSelect?: boolean;
  /** Placeholder для поиска */
  placeholder?: string;
}

/**
 * Компонент выбора университета с поиском
 */
export default function UniversitySelector({
  onSelect,
  navigateOnSelect = true,
  placeholder = 'Поиск университета...',
}: UniversitySelectorProps) {
  const searchQuery = useSignal('');
  const universities = useSignal<UniversityItem[]>([]);
  const isLoading = useSignal(false);
  const isOpen = useSignal(false);
  const error = useSignal<string | null>(null);
  const selectedIndex = useSignal(-1);

  // Фильтрованный список
  const filteredUniversities = useComputed(() => {
    const query = searchQuery.value.toLowerCase();
    if (!query) return universities.value;
    
    return universities.value.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.name_en?.toLowerCase().includes(query) ||
        u.city.toLowerCase().includes(query)
    );
  });

  // Загрузка университетов
  useEffect(() => {
    const fetchUniversities = async () => {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await fetch('/api/universities?limit=100');
        
        if (!response.ok) {
          throw new Error('Не удалось загрузить список университетов');
        }

        const data = await response.json();
        universities.value = data.data;
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Ошибка загрузки';
      } finally {
        isLoading.value = false;
      }
    };

    fetchUniversities();
  }, []);

  // Обработка выбора
  const handleSelect = (university: UniversityItem) => {
    searchQuery.value = university.name;
    isOpen.value = false;
    selectedIndex.value = -1;

    if (onSelect) {
      onSelect(university);
    }

    if (navigateOnSelect) {
      window.location.href = `/universities/${university.id}`;
    }
  };

  // Клавиатурная навигация
  const handleKeyDown = (e: KeyboardEvent) => {
    const items = filteredUniversities.value;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex.value = Math.min(selectedIndex.value + 1, items.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex.value = Math.max(selectedIndex.value - 1, 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex.value >= 0 && items[selectedIndex.value]) {
          handleSelect(items[selectedIndex.value]);
        }
        break;
      case 'Escape':
        isOpen.value = false;
        selectedIndex.value = -1;
        break;
    }
  };

  return (
    <div class="relative w-full max-w-xl">
      {/* Поле поиска */}
      <div class="relative">
        <input
          type="text"
          value={searchQuery.value}
          onInput={(e) => {
            searchQuery.value = (e.target as HTMLInputElement).value;
            isOpen.value = true;
            selectedIndex.value = -1;
          }}
          onFocus={() => (isOpen.value = true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          class="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
        <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          {isLoading.value ? (
            <div class="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          ) : (
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Ошибка */}
      {error.value && (
        <div class="mt-2 text-red-600 text-sm">{error.value}</div>
      )}

      {/* Выпадающий список */}
      {isOpen.value && !isLoading.value && filteredUniversities.value.length > 0 && (
        <div class="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {filteredUniversities.value.map((university, index) => (
            <button
              type="button"
              key={university.id}
              onClick={() => handleSelect(university)}
              onMouseEnter={() => (selectedIndex.value = index)}
              class={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                selectedIndex.value === index ? 'bg-blue-50' : ''
              } ${index > 0 ? 'border-t border-gray-100' : ''}`}
            >
              {/* Логотип или placeholder */}
              <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {university.logo_url ? (
                  <img
                    src={university.logo_url}
                    alt=""
                    class="w-8 h-8 object-contain"
                  />
                ) : (
                  <span class="text-lg">🎓</span>
                )}
              </div>

              {/* Информация */}
              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900 truncate">
                  {university.name}
                </div>
                <div class="text-sm text-gray-500">
                  {university.city}, {university.country}
                </div>
              </div>

              {/* Стрелка */}
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}

      {/* Пустой результат */}
      {isOpen.value && !isLoading.value && searchQuery.value && filteredUniversities.value.length === 0 && (
        <div class="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          Университеты не найдены
        </div>
      )}

      {/* Overlay для закрытия */}
      {isOpen.value && (
        <div
          class="fixed inset-0 z-40"
          onClick={() => (isOpen.value = false)}
        />
      )}
    </div>
  );
}

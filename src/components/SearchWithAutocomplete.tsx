/**
 * Компонент поиска с автодополнением
 * Поддержка keyboard navigation, debounce, создание университетов
 */

import { useSignal } from '@preact/signals';
import { useEffect, useRef, useCallback } from 'preact/hooks';

/**
 * Результат автодополнения
 */
interface AutocompleteResult {
  id?: string;
  name: string;
  country: string;
  found_in_db: boolean;
  source: 'db' | 'ollama';
}

interface SearchWithAutocompleteProps {
  onSelect?: (result: AutocompleteResult) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Компонент поиска с автодополнением
 * @param onSelect - callback при выборе результата
 * @param placeholder - placeholder для input
 * @param className - дополнительные CSS классы
 */
export const SearchWithAutocomplete = ({
  onSelect,
  placeholder = 'Введите название университета...',
  className = '',
}: SearchWithAutocompleteProps) => {
  const query = useSignal('');
  const results = useSignal<AutocompleteResult[]>([]);
  const loading = useSignal(false);
  const showDropdown = useSignal(false);
  const selectedIndex = useSignal(-1);
  const showCreateModal = useSignal(false);
  const selectedForCreate = useSignal<AutocompleteResult | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  // Debounced поиск
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      results.value = [];
      showDropdown.value = false;
      return;
    }

    loading.value = true;
    
    try {
      const response = await fetch(
        `/api/search/autocomplete?q=${encodeURIComponent(searchQuery)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        results.value = data.results || [];
        showDropdown.value = results.value.length > 0;
        selectedIndex.value = -1;
      } else {
        results.value = [];
        showDropdown.value = false;
      }
    } catch {
      results.value = [];
      showDropdown.value = false;
    } finally {
      loading.value = false;
    }
  }, []);

  // Обработка ввода
  const handleInput = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    query.value = value;

    // Отменить предыдущий debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Установить новый debounce
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Обработка выбора результата
  const handleSelect = (result: AutocompleteResult) => {
    if (result.found_in_db) {
      // Университет в БД - переход на профиль
      if (result.id) {
        globalThis.location.href = `/universities/${result.id}`;
      }
      onSelect?.(result);
    } else {
      // Университет не в БД - показать modal для создания
      selectedForCreate.value = result;
      showCreateModal.value = true;
    }

    showDropdown.value = false;
    query.value = result.name;
  };

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showDropdown.value) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex.value = Math.min(
          selectedIndex.value + 1,
          results.value.length - 1
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex.value >= 0 && results.value[selectedIndex.value]) {
          handleSelect(results.value[selectedIndex.value]);
        } else if (results.value.length === 1) {
          handleSelect(results.value[0]);
        }
        break;
      case 'Escape':
        showDropdown.value = false;
        selectedIndex.value = -1;
        break;
    }
  };

  // Клик вне dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        showDropdown.value = false;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Создание университета
  const handleCreateUniversity = () => {
    if (!selectedForCreate.value) return;

    // Перенаправляем на страницу поиска с предзаполненным запросом
    const searchUrl = `/?search=${encodeURIComponent(selectedForCreate.value.name)}`;
    globalThis.location.href = searchUrl;
    
    showCreateModal.value = false;
    selectedForCreate.value = null;
  };

  return (
    <div class={`relative ${className}`}>
      {/* Input поле */}
      <div class="relative">
        <input
          ref={inputRef}
          type="text"
          value={query.value}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.value.length > 0) {
              showDropdown.value = true;
            }
          }}
          placeholder={placeholder}
          class="w-full px-4 py-3 pr-12 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
        />
        
        {/* Loading spinner */}
        {loading.value && (
          <div class="absolute right-4 top-1/2 -translate-y-1/2">
            <div class="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {/* Search icon */}
        {!loading.value && (
          <div class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </div>
        )}
      </div>

      {/* Dropdown с результатами */}
      {showDropdown.value && results.value.length > 0 && (
        <div
          ref={dropdownRef}
          class="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {results.value.map((result, index) => (
            <SearchResultItem
              key={result.id || result.name}
              result={result}
              isSelected={index === selectedIndex.value}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => { selectedIndex.value = index; }}
            />
          ))}
        </div>
      )}

      {/* Modal для создания университета */}
      {showCreateModal.value && selectedForCreate.value && (
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">
              Университет не найден в базе
            </h2>
            <p class="text-gray-600 mb-4">
              <strong>{selectedForCreate.value.name}</strong> ({selectedForCreate.value.country}) 
              не найден в нашей базе данных.
            </p>
            <p class="text-gray-500 text-sm mb-6">
              Хотите добавить его? Мы проверим информацию через AI и добавим в базу.
            </p>
            <div class="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  showCreateModal.value = false;
                  selectedForCreate.value = null;
                }}
                class="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCreateUniversity}
                class="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SearchResultItemProps {
  result: AutocompleteResult;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

/**
 * Элемент результата поиска
 */
const SearchResultItem = ({
  result,
  isSelected,
  onClick,
  onMouseEnter,
}: SearchResultItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      class={`w-full text-left p-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
        isSelected
          ? 'bg-blue-50 text-blue-900'
          : 'hover:bg-gray-50'
      }`}
    >
      <div class="flex-1 min-w-0">
        <p class="font-medium text-gray-900 truncate">{result.name}</p>
        <p class="text-sm text-gray-500 truncate">📍 {result.country}</p>
      </div>
      
      {/* Badge */}
      <span
        class={`inline-block px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
          result.found_in_db
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}
      >
        {result.found_in_db ? '✓ В базе' : '+ Добавить'}
      </span>
    </button>
  );
};

export default SearchWithAutocomplete;

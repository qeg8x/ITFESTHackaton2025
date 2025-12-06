/**
 * Компоненты фильтрации университетов
 * FilterPanel, FilterSelect, FilterRangeSlider, FilterCheckbox
 */

import { useSignal } from '@preact/signals';
import { useCallback, useEffect, useRef } from 'preact/hooks';

/**
 * Интерфейс фильтров
 */
export interface Filters {
  country: string;
  specializations: string[];
  languages: string[];
  degree_levels: string[];
  min_tuition: number;
  max_tuition: number;
  accepts_international: boolean | null;
  size_category: string;
}

/**
 * Доступные опции для фильтров
 */
export const FILTER_OPTIONS = {
  countries: [
    'Kazakhstan', 'Russia', 'USA', 'UK', 'Germany', 'China', 'Japan',
    'South Korea', 'Turkey', 'UAE', 'Canada', 'Australia', 'France',
  ],
  specializations: [
    'STEM', 'Business', 'Medicine', 'Arts', 'Engineering',
    'Law', 'Humanities', 'Social Sciences', 'Education', 'Agriculture',
  ],
  languages: ['English', 'Russian', 'Kazakh', 'German', 'French', 'Chinese', 'Japanese'],
  degree_levels: ['Bachelor', 'Master', 'PhD'],
  sizes: [
    { value: 'small', label: 'Маленький (<5000)' },
    { value: 'medium', label: 'Средний (5000-20000)' },
    { value: 'large', label: 'Большой (>20000)' },
  ],
};

/**
 * Начальные значения фильтров
 */
export const DEFAULT_FILTERS: Filters = {
  country: '',
  specializations: [],
  languages: [],
  degree_levels: [],
  min_tuition: 0,
  max_tuition: 100000,
  accepts_international: null,
  size_category: '',
};

interface UniversityFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
  onReset: () => void;
  loading?: boolean;
}

/**
 * Главный компонент фильтров
 */
export const UniversityFilters = ({
  filters,
  onFilterChange,
  onReset,
  loading = false,
}: UniversityFiltersProps) => {
  const isExpanded = useSignal(false);
  const isMobile = useSignal(false);

  // Проверка размера экрана
  useEffect(() => {
    const checkMobile = () => {
      isMobile.value = globalThis.innerWidth < 768;
    };
    checkMobile();
    globalThis.addEventListener('resize', checkMobile);
    return () => globalThis.removeEventListener('resize', checkMobile);
  }, []);

  const updateFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      onFilterChange({ ...filters, [key]: value });
    },
    [filters, onFilterChange]
  );

  const activeFiltersCount = [
    filters.country,
    filters.specializations.length > 0,
    filters.languages.length > 0,
    filters.degree_levels.length > 0,
    filters.min_tuition > 0,
    filters.max_tuition < 100000,
    filters.accepts_international !== null,
    filters.size_category,
  ].filter(Boolean).length;

  return (
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => { isExpanded.value = !isExpanded.value; }}
        class="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center gap-2">
          <span class="text-lg">🔍</span>
          <span class="font-medium text-gray-900">Фильтры</span>
          {activeFiltersCount > 0 && (
            <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <svg
          class={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
            isExpanded.value ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter Panel */}
      <div
        class={`overflow-hidden transition-all duration-300 ${
          isExpanded.value ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div class="p-4 border-t border-gray-100 space-y-4">
          {/* Country */}
          <FilterSelect
            label="Страна"
            value={filters.country}
            options={FILTER_OPTIONS.countries.map((c) => ({ value: c, label: c }))}
            onChange={(v) => updateFilter('country', v)}
            placeholder="Все страны"
          />

          {/* Specializations */}
          <FilterMultiSelect
            label="Специализация"
            values={filters.specializations}
            options={FILTER_OPTIONS.specializations}
            onChange={(v) => updateFilter('specializations', v)}
          />

          {/* Languages */}
          <FilterMultiSelect
            label="Язык обучения"
            values={filters.languages}
            options={FILTER_OPTIONS.languages}
            onChange={(v) => updateFilter('languages', v)}
          />

          {/* Degree Levels */}
          <FilterMultiSelect
            label="Уровень образования"
            values={filters.degree_levels}
            options={FILTER_OPTIONS.degree_levels}
            onChange={(v) => updateFilter('degree_levels', v)}
          />

          {/* Tuition Range */}
          <FilterRangeSlider
            label="Стоимость обучения ($/год)"
            minValue={filters.min_tuition}
            maxValue={filters.max_tuition}
            min={0}
            max={100000}
            step={1000}
            onMinChange={(v) => updateFilter('min_tuition', v)}
            onMaxChange={(v) => updateFilter('max_tuition', v)}
          />

          {/* Size */}
          <FilterSelect
            label="Размер университета"
            value={filters.size_category}
            options={FILTER_OPTIONS.sizes}
            onChange={(v) => updateFilter('size_category', v)}
            placeholder="Любой размер"
          />

          {/* Accepts International */}
          <FilterCheckbox
            label="Принимает иностранных студентов"
            checked={filters.accepts_international}
            onChange={(v) => updateFilter('accepts_international', v)}
          />

          {/* Reset Button */}
          <div class="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onReset}
              disabled={loading}
              class="w-full py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface FilterSelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Компонент выпадающего списка
 */
const FilterSelect = ({
  label,
  value,
  options,
  onChange,
  placeholder = 'Выберите...',
}: FilterSelectProps) => (
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none transition-all bg-white text-sm"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

interface FilterMultiSelectProps {
  label: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
}

/**
 * Компонент множественного выбора (chips)
 */
const FilterMultiSelect = ({
  label,
  values,
  options,
  onChange,
}: FilterMultiSelectProps) => {
  const toggleValue = (option: string) => {
    if (values.includes(option)) {
      onChange(values.filter((v) => v !== option));
    } else {
      onChange([...values, option]);
    }
  };

  return (
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div class="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggleValue(option)}
            class={`px-3 py-1.5 text-sm rounded-full border transition-all ${
              values.includes(option)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

interface FilterRangeSliderProps {
  label: string;
  minValue: number;
  maxValue: number;
  min: number;
  max: number;
  step: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}

/**
 * Компонент диапазона (два слайдера)
 */
const FilterRangeSlider = ({
  label,
  minValue,
  maxValue,
  min,
  max,
  step,
  onMinChange,
  onMaxChange,
}: FilterRangeSliderProps) => {
  const debounceRef = useRef<number | null>(null);

  const handleMinChange = (value: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onMinChange(Math.min(value, maxValue - step));
    }, 300);
  };

  const handleMaxChange = (value: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onMaxChange(Math.max(value, minValue + step));
    }, 300);
  };

  const formatValue = (v: number) => {
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
    return `$${v}`;
  };

  return (
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div class="space-y-3">
        <div class="flex items-center justify-between text-sm text-gray-600">
          <span>{formatValue(minValue)}</span>
          <span>{formatValue(maxValue)}</span>
        </div>
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500 w-8">От:</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={minValue}
              onInput={(e) => handleMinChange(parseInt((e.target as HTMLInputElement).value, 10))}
              class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500 w-8">До:</span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={maxValue}
              onInput={(e) => handleMaxChange(parseInt((e.target as HTMLInputElement).value, 10))}
              class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface FilterCheckboxProps {
  label: string;
  checked: boolean | null;
  onChange: (value: boolean | null) => void;
}

/**
 * Компонент чекбокса с тремя состояниями
 */
const FilterCheckbox = ({ label, checked, onChange }: FilterCheckboxProps) => {
  const handleClick = () => {
    // Цикл: null -> true -> false -> null
    if (checked === null) onChange(true);
    else if (checked === true) onChange(false);
    else onChange(null);
  };

  return (
    <div class="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        class={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          checked === true
            ? 'bg-blue-600 border-blue-600 text-white'
            : checked === false
            ? 'bg-red-100 border-red-300 text-red-600'
            : 'bg-white border-gray-300'
        }`}
      >
        {checked === true && <span class="text-xs">✓</span>}
        {checked === false && <span class="text-xs">✕</span>}
      </button>
      <span class="text-sm text-gray-700">{label}</span>
      {checked !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          class="text-xs text-gray-400 hover:text-gray-600"
        >
          (сбросить)
        </button>
      )}
    </div>
  );
};

export default UniversityFilters;

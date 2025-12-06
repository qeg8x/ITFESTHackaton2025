/**
 * Language Context для управления локализацией
 * Поддержка русского, казахского и английского языков
 */

import { createContext } from 'preact';
import { useContext, useEffect } from 'preact/hooks';
import { useSignal, type Signal } from '@preact/signals';

// Импорт переводов
import ruTranslations from '../locales/ru.json' with { type: 'json' };
import enTranslations from '../locales/en.json' with { type: 'json' };
import kkTranslations from '../locales/kk.json' with { type: 'json' };

/**
 * Поддерживаемые языки
 */
export type Language = 'ru' | 'en' | 'kk';

/**
 * Информация о языке
 */
export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

/**
 * Доступные языки
 */
export const LANGUAGES: LanguageInfo[] = [
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', flag: '🇰🇿' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
];

/**
 * Тип переводов
 */
type Translations = typeof ruTranslations;

/**
 * Словари переводов
 */
const translations: Record<Language, Translations> = {
  ru: ruTranslations,
  en: enTranslations,
  kk: kkTranslations as Translations,
};

/**
 * Контекст языка
 */
interface LanguageContextType {
  language: Signal<Language>;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  getTranslation: (university: UniversityTranslation, field: keyof TranslatedFields) => string;
}

/**
 * Переведённые поля университета
 */
interface TranslatedFields {
  name: string;
  description?: string;
  mission?: string;
}

/**
 * Переводы университета в БД
 */
interface UniversityTranslation {
  translations?: {
    ru?: TranslatedFields;
    kk?: TranslatedFields;
    en?: TranslatedFields;
  };
  name: string;
  description?: string;
  mission?: string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'language';
const DEFAULT_LANGUAGE: Language = 'ru';

/**
 * Получить сохранённый язык
 */
const getSavedLanguage = (): Language => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['ru', 'en', 'kk'].includes(saved)) {
      return saved as Language;
    }
  } catch {
    // localStorage недоступен
  }
  return DEFAULT_LANGUAGE;
};

/**
 * Сохранить язык
 */
const saveLanguage = (lang: Language): void => {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // localStorage недоступен
  }
};

interface LanguageProviderProps {
  children: preact.ComponentChildren;
}

/**
 * Provider для языкового контекста
 */
export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const language = useSignal<Language>(DEFAULT_LANGUAGE);

  // Загрузить сохранённый язык при монтировании
  useEffect(() => {
    language.value = getSavedLanguage();
  }, []);

  /**
   * Установить язык
   */
  const setLanguage = (lang: Language) => {
    language.value = lang;
    saveLanguage(lang);
  };

  /**
   * Получить перевод по ключу
   * @param key - ключ в формате "section.key" (например, "common.search")
   * @param fallback - значение по умолчанию
   */
  const t = (key: string, fallback?: string): string => {
    const keys = key.split('.');
    let result: unknown = translations[language.value];

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = (result as Record<string, unknown>)[k];
      } else {
        return fallback || key;
      }
    }

    return typeof result === 'string' ? result : fallback || key;
  };

  /**
   * Получить перевод поля университета
   * @param university - объект университета с переводами
   * @param field - поле для получения (name, description, mission)
   */
  const getTranslation = (
    university: UniversityTranslation,
    field: keyof TranslatedFields
  ): string => {
    // Попробовать получить перевод на текущем языке
    const langTranslation = university.translations?.[language.value];
    if (langTranslation && langTranslation[field]) {
      return langTranslation[field] as string;
    }

    // Fallback на оригинальное поле
    return (university[field] as string) || '';
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getTranslation }}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook для использования языкового контекста
 */
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

/**
 * Компонент переключателя языка
 */
export const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();
  const isOpen = useSignal(false);

  const currentLang = LANGUAGES.find((l) => l.code === language.value) || LANGUAGES[0];

  return (
    <div class="relative">
      <button
        type="button"
        onClick={() => { isOpen.value = !isOpen.value; }}
        class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <span>{currentLang.flag}</span>
        <span class="hidden sm:inline">{currentLang.code.toUpperCase()}</span>
        <svg
          class={`w-4 h-4 transition-transform ${isOpen.value ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen.value && (
        <>
          {/* Backdrop */}
          <div
            class="fixed inset-0 z-40"
            onClick={() => { isOpen.value = false; }}
          />
          
          {/* Dropdown */}
          <div class="absolute right-0 top-full mt-1 py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-32">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  isOpen.value = false;
                }}
                class={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                  language.value === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageProvider;

/**
 * Компонент переключателя языка
 * Варианты: кнопки с флагами или dropdown
 */

import { useSignal } from '@preact/signals';
import { useLanguage, LANGUAGES } from '../contexts/LanguageContext.tsx';

interface LanguageSwitcherProps {
  variant?: 'buttons' | 'dropdown';
  showLabels?: boolean;
  className?: string;
}

/**
 * Переключатель языка с флагами
 * @param variant - 'buttons' для кнопок, 'dropdown' для выпадающего списка
 * @param showLabels - показывать ли текстовые метки
 * @param className - дополнительные CSS классы
 */
export const LanguageSwitcher = ({
  variant = 'buttons',
  showLabels = true,
  className = '',
}: LanguageSwitcherProps) => {
  if (variant === 'dropdown') {
    return <LanguageSwitcherDropdown showLabels={showLabels} className={className} />;
  }
  return <LanguageSwitcherButtons showLabels={showLabels} className={className} />;
};

interface ButtonsProps {
  showLabels: boolean;
  className: string;
}

/**
 * Вариант с кнопками (флаги)
 */
const LanguageSwitcherButtons = ({ showLabels, className }: ButtonsProps) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div class={`flex items-center gap-1 ${className}`}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => setLanguage(lang.code)}
          class={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            language.value === lang.code
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={lang.nativeName}
        >
          <span class="text-base">{lang.flag}</span>
          {showLabels && (
            <span class="hidden sm:inline">{lang.code.toUpperCase()}</span>
          )}
        </button>
      ))}
    </div>
  );
};

/**
 * Вариант с dropdown
 */
const LanguageSwitcherDropdown = ({ showLabels, className }: ButtonsProps) => {
  const { language, setLanguage } = useLanguage();
  const isOpen = useSignal(false);

  const currentLang = LANGUAGES.find((l) => l.code === language.value) || LANGUAGES[0];

  return (
    <div class={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { isOpen.value = !isOpen.value; }}
        class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
      >
        <span class="text-base">{currentLang.flag}</span>
        {showLabels && (
          <span class="hidden sm:inline">{currentLang.code.toUpperCase()}</span>
        )}
        <svg
          class={`w-4 h-4 transition-transform duration-200 ${isOpen.value ? 'rotate-180' : ''}`}
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
          
          {/* Dropdown menu */}
          <div class="absolute right-0 top-full mt-1 py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-36 animate-fade-in">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  isOpen.value = false;
                }}
                class={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                  language.value === lang.code
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span class="text-base">{lang.flag}</span>
                <span class="flex-1">{lang.nativeName}</span>
                {language.value === lang.code && (
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Компактный переключатель (только флаги)
 */
export const LanguageSwitcherCompact = () => {
  const { language, setLanguage } = useLanguage();

  const cycleLanguage = () => {
    const currentIndex = LANGUAGES.findIndex((l) => l.code === language.value);
    const nextIndex = (currentIndex + 1) % LANGUAGES.length;
    setLanguage(LANGUAGES[nextIndex].code);
  };

  const currentLang = LANGUAGES.find((l) => l.code === language.value) || LANGUAGES[0];

  return (
    <button
      type="button"
      onClick={cycleLanguage}
      class="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
      title={`${currentLang.nativeName} → Click to change`}
    >
      <span class="text-xl">{currentLang.flag}</span>
    </button>
  );
};

export default LanguageSwitcher;

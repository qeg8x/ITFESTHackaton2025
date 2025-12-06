/**
 * Экспорт локализаций и компонентов
 */

// JSON переводы
export { default as ru } from './ru.json' with { type: 'json' };
export { default as en } from './en.json' with { type: 'json' };
export { default as kk } from './kk.json' with { type: 'json' };

// Типы и Context
export type { Language, LanguageInfo } from '../contexts/LanguageContext.tsx';
export { 
  LANGUAGES, 
  LanguageProvider, 
  useLanguage, 
  LanguageSwitcher as LanguageSwitcherDropdown,
} from '../contexts/LanguageContext.tsx';

// Компоненты переключателя языка
export { 
  LanguageSwitcher,
  LanguageSwitcherCompact,
} from '../components/LanguageSwitcher.tsx';

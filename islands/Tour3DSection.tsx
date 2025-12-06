/**
 * Island компонент для секции 3D-тура (Google Street View)
 * Встроенная панорама прямо на странице
 */

import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';

/** API ключ для Street View API */
const STREET_VIEW_API_KEY = 'AIzaSyBY5JSVAGaGC2fc1LDejaPkzXPeo6Nw6k8';

interface Tour3DSectionProps {
  universityId: string;
  universityName: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Переводы передаются через props для избежания проблем с island контекстом */
  translations?: {
    title: string;
    openFullscreen: string;
    loading: string;
    hint: string;
  };
}

/** Дефолтные переводы */
const DEFAULT_TRANSLATIONS = {
  title: '3D-тур по кампусу',
  openFullscreen: 'Открыть на весь экран',
  loading: 'Загрузка панорамы...',
  hint: 'Используйте мышь для навигации по панораме',
};

/**
 * Секция 3D-тура - встроенная Google Street View панорама
 */
export default function Tour3DSection({ 
  universityId: _universityId, 
  universityName, 
  latitude, 
  longitude,
  translations,
}: Tour3DSectionProps) {
  const t = translations || DEFAULT_TRANSLATIONS;
  const iframeLoading = useSignal(true);
  const hasCoords = latitude && longitude;

  // Резервный таймаут на случай если onLoad не срабатывает
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (iframeLoading.value) {
        iframeLoading.value = false;
      }
    }, 5000); // Уменьшил до 5 секунд
    
    return () => clearTimeout(timeout);
  }, []);

  /**
   * Получить URL для встроенной Street View панорамы
   */
  const getStreetViewEmbedUrl = (): string => {
    if (hasCoords) {
      // Street View панорама по координатам
      return `https://www.google.com/maps/embed/v1/streetview?key=${STREET_VIEW_API_KEY}&location=${latitude},${longitude}&heading=0&pitch=0&fov=90`;
    }
    // Поиск по названию
    return `https://www.google.com/maps/embed/v1/place?key=${STREET_VIEW_API_KEY}&q=${encodeURIComponent(universityName)}`;
  };

  /**
   * Открыть полноэкранную панораму в новой вкладке
   */
  const openFullscreen = () => {
    const url = hasCoords
      ? `https://www.google.com/maps/@${latitude},${longitude},3a,75y,0h,90t/data=!3m6!1e1!3m4!1s!2e0!7i16384!8i8192`
      : `https://www.google.com/maps/search/${encodeURIComponent(universityName)}`;
    globalThis.open(url, '_blank');
  };

  return (
    <section class="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
      {/* Header */}
      <div class="p-4 border-b border-dark-600 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg flex items-center justify-center border border-blue-500/30">
            <span class="text-xl">🎬</span>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-white">{t.title}</h2>
            <p class="text-xs text-gray-400">
              {hasCoords ? `${latitude!.toFixed(4)}, ${longitude!.toFixed(4)}` : universityName}
            </p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={openFullscreen}
          class="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <span class="hidden sm:inline">{t.openFullscreen}</span>
        </button>
      </div>

      {/* Встроенная панорама */}
      <div class="relative">
        {iframeLoading.value && (
          <div class="absolute inset-0 bg-dark-800 flex items-center justify-center z-10">
            <div class="text-center">
              <div class="animate-spin text-4xl mb-2">🔄</div>
              <p class="text-gray-400">{t.loading}</p>
            </div>
          </div>
        )}

        <iframe
          src={getStreetViewEmbedUrl()}
          class="w-full h-[400px] md:h-[500px] border-0"
          allowFullScreen
          loading="lazy"
          onLoad={() => { iframeLoading.value = false; }}
          style="min-height: 400px;"
        />
      </div>

      {/* Footer с подсказкой */}
      <div class="p-3 bg-dark-700/30 border-t border-dark-600 text-center">
        <p class="text-xs text-gray-500">
          {t.hint}
        </p>
      </div>
    </section>
  );
}

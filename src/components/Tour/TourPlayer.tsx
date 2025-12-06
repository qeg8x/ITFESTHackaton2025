/**
 * Универсальный плеер для 3D-туров
 * Поддерживает Google Maps, Yandex Panoramas, 2GIS
 */

import { useState } from 'preact/hooks';
import type { ThreeDTourProvider, ThreeDTourSource } from '../../types/university.ts';

interface TourPlayerProps {
  tourData: {
    id: string;
    name: string;
    available_sources: ThreeDTourProvider[];
    primary_source: ThreeDTourProvider | null;
    tour_data: {
      google_maps?: ThreeDTourSource;
      yandex_panorama?: ThreeDTourSource;
      twogis?: ThreeDTourSource;
    } | null;
  };
}

/**
 * Получить человекочитаемое название источника
 */
const getSourceLabel = (source: ThreeDTourProvider): string => {
  const labels: Record<ThreeDTourProvider, string> = {
    google: '🔵 Google Maps Street View',
    yandex: '🔴 Яндекс Панорамы',
    '2gis': '📍 2GIS Карты',
  };
  return labels[source];
};

/**
 * Получить ключ для источника в объекте данных
 */
const getSourceKey = (source: ThreeDTourProvider): 'google_maps' | 'yandex_panorama' | 'twogis' => {
  const keyMap: Record<ThreeDTourProvider, 'google_maps' | 'yandex_panorama' | 'twogis'> = {
    google: 'google_maps',
    yandex: 'yandex_panorama',
    '2gis': 'twogis',
  };
  return keyMap[source];
};

/**
 * Плеер для iframe источника
 */
const IframePlayer = ({ url, source }: { url: string; source: ThreeDTourProvider }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const bgColors: Record<ThreeDTourProvider, string> = {
    google: 'bg-blue-900/20',
    yandex: 'bg-red-900/20',
    '2gis': 'bg-green-900/20',
  };

  return (
    <div class={`relative w-full h-[500px] md:h-[600px] ${bgColors[source]} rounded-lg overflow-hidden`}>
      {isLoading && (
        <div class="absolute inset-0 flex items-center justify-center bg-dark-800">
          <div class="text-center">
            <div class="animate-spin text-4xl mb-2">🔄</div>
            <p class="text-gray-400">Загрузка панорамы...</p>
          </div>
        </div>
      )}

      {hasError && (
        <div class="absolute inset-0 flex items-center justify-center bg-dark-800">
          <div class="text-center">
            <div class="text-4xl mb-2">❌</div>
            <p class="text-red-400">Не удалось загрузить панораму</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              class="mt-2 inline-block text-cyber-400 hover:underline"
            >
              Открыть в новой вкладке →
            </a>
          </div>
        </div>
      )}

      <iframe
        src={url}
        class="w-full h-full border-0"
        allowFullScreen
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};

/**
 * Основной компонент плеера
 */
export default function TourPlayer({ tourData }: TourPlayerProps) {
  const [selectedSource, setSelectedSource] = useState<ThreeDTourProvider>(
    tourData.primary_source || tourData.available_sources[0]
  );

  const getCurrentTour = (): ThreeDTourSource | null => {
    if (!tourData.tour_data) return null;
    const key = getSourceKey(selectedSource);
    return tourData.tour_data[key] || null;
  };

  const currentTour = getCurrentTour();

  if (!currentTour) {
    return (
      <div class="p-8 text-center bg-dark-800 rounded-lg border border-dark-600">
        <div class="text-4xl mb-4">🎬</div>
        <p class="text-gray-400">Выбранный источник недоступен</p>
      </div>
    );
  }

  return (
    <div class="space-y-4">
      {/* Заголовок */}
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 class="text-xl font-bold text-white">
          🎬 3D Тур: {tourData.name}
        </h2>

        {/* Переключатель источников */}
        {tourData.available_sources.length > 1 && (
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-400">Источник:</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource((e.target as HTMLSelectElement).value as ThreeDTourProvider)}
              class="px-3 py-2 bg-dark-700 border border-dark-600 text-white rounded-lg text-sm focus:ring-cyber-500 focus:border-cyber-500"
            >
              {tourData.available_sources.map((source) => (
                <option key={source} value={source}>
                  {getSourceLabel(source)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Плеер */}
      <div class="border-2 border-cyber-500/30 rounded-lg overflow-hidden hover:border-cyber-500/50 transition-colors">
        <IframePlayer url={currentTour.url} source={selectedSource} />
      </div>

      {/* Информация о локации */}
      {currentTour.address && (
        <div class="p-4 bg-dark-800 border border-dark-600 rounded-lg">
          <div class="flex items-start gap-3">
            <span class="text-xl">📍</span>
            <div>
              <p class="text-white font-medium">{currentTour.address}</p>
              {currentTour.latitude && currentTour.longitude && (
                <p class="text-xs text-gray-500 mt-1">
                  Координаты: {currentTour.latitude.toFixed(4)}, {currentTour.longitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Инструкции */}
      <div class="p-4 bg-dark-800/50 border border-dark-700 rounded-lg">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div class="flex items-start gap-2">
            <span>🎮</span>
            <div>
              <p class="text-gray-300 font-medium">Управление</p>
              <p class="text-gray-500">Мышь или сенсор для вращения</p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <span>🔄</span>
            <div>
              <p class="text-gray-300 font-medium">Источники</p>
              <p class="text-gray-500">Переключайся выше для разных ракурсов</p>
            </div>
          </div>
          <div class="flex items-start gap-2">
            <span>💡</span>
            <div>
              <p class="text-gray-300 font-medium">Совет</p>
              <p class="text-gray-500">Если не работает — попробуй другой источник</p>
            </div>
          </div>
        </div>
      </div>

      {/* Внешние ссылки */}
      <div class="flex flex-wrap gap-2">
        <a
          href={currentTour.url}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 px-3 py-1.5 bg-dark-700 border border-dark-600 text-gray-300 rounded-lg text-sm hover:bg-dark-600 hover:text-white transition-colors"
        >
          🔗 Открыть в {getSourceLabel(selectedSource).split(' ')[1]}
        </a>

        {currentTour.latitude && currentTour.longitude && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${currentTour.latitude},${currentTour.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 px-3 py-1.5 bg-dark-700 border border-dark-600 text-gray-300 rounded-lg text-sm hover:bg-dark-600 hover:text-white transition-colors"
          >
            🗺️ Показать на карте
          </a>
        )}
      </div>
    </div>
  );
}

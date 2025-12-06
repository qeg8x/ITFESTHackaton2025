/**
 * Island компонент для секции 3D-тура на странице университета
 */

import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import type { ThreeDTourProvider, ThreeDTourSource } from '../src/types/university.ts';

interface Tour3DSectionProps {
  universityId: string;
  universityName: string;
}

interface TourData {
  id: string;
  name: string;
  available_sources: ThreeDTourProvider[];
  primary_source: ThreeDTourProvider | null;
  tour_data: {
    google_maps?: ThreeDTourSource;
    yandex_panorama?: ThreeDTourSource;
    twogis?: ThreeDTourSource;
  } | null;
}

/**
 * Получить название источника
 */
const getSourceLabel = (source: ThreeDTourProvider): string => {
  const labels: Record<ThreeDTourProvider, string> = {
    google: '🔵 Google Street View',
    yandex: '🔴 Яндекс Панорамы',
    '2gis': '📍 2GIS',
  };
  return labels[source];
};

/**
 * Получить ключ источника
 */
const getSourceKey = (source: ThreeDTourProvider): 'google_maps' | 'yandex_panorama' | 'twogis' => {
  const keys: Record<ThreeDTourProvider, 'google_maps' | 'yandex_panorama' | 'twogis'> = {
    google: 'google_maps',
    yandex: 'yandex_panorama',
    '2gis': 'twogis',
  };
  return keys[source];
};

/**
 * Секция 3D-тура
 */
export default function Tour3DSection({ universityId, universityName: _universityName }: Tour3DSectionProps) {
  const tourData = useSignal<TourData | null>(null);
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);
  const isExpanded = useSignal(false);
  const selectedSource = useSignal<ThreeDTourProvider | null>(null);
  const iframeLoading = useSignal(false);

  // Загрузка данных тура
  useEffect(() => {
    const loadTour = async () => {
      try {
        const response = await fetch(`/api/universities/${universityId}/3d-tour`);
        
        if (response.ok) {
          const data = await response.json();
          tourData.value = data;
          selectedSource.value = data.primary_source || data.available_sources?.[0] || null;
        } else if (response.status === 404) {
          // Тур не найден - это нормально
          tourData.value = null;
        } else {
          error.value = 'Не удалось загрузить тур';
        }
      } catch (err) {
        console.error('Error loading tour:', err);
        error.value = 'Ошибка загрузки';
      } finally {
        loading.value = false;
      }
    };

    loadTour();
  }, [universityId]);

  // Не показывать секцию если нет тура
  if (loading.value) {
    return null; // Не показывать skeleton - просто скрыть
  }

  if (!tourData.value || !tourData.value.available_sources?.length) {
    return null; // Тур недоступен - не показывать секцию
  }

  const currentSource = selectedSource.value;
  const currentTour = currentSource && tourData.value.tour_data 
    ? tourData.value.tour_data[getSourceKey(currentSource)]
    : null;

  return (
    <section class="bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
      {/* Header - всегда видимый */}
      <button
        type="button"
        onClick={() => {
          isExpanded.value = !isExpanded.value;
          if (isExpanded.value) {
            iframeLoading.value = true;
          }
        }}
        class="w-full flex items-center justify-between p-6 hover:bg-dark-700 transition-colors"
      >
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-gradient-to-br from-cyber-500/20 to-neon-500/20 rounded-lg flex items-center justify-center">
            <span class="text-2xl">🎬</span>
          </div>
          <div class="text-left">
            <h2 class="text-xl font-semibold text-white">3D Виртуальный тур</h2>
            <p class="text-sm text-gray-400">
              Доступно источников: {tourData.value.available_sources.length} 
              ({tourData.value.available_sources.map(s => s === 'google' ? 'Google' : s === 'yandex' ? 'Яндекс' : '2GIS').join(', ')})
            </p>
          </div>
        </div>
        
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 bg-cyber-500/20 text-cyber-400 text-sm rounded-full">
            {isExpanded.value ? 'Свернуть' : 'Развернуть'}
          </span>
          <svg 
            class={`w-6 h-6 text-gray-400 transition-transform ${isExpanded.value ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expandable content */}
      {isExpanded.value && (
        <div class="border-t border-dark-600">
          {/* Source selector */}
          {tourData.value.available_sources.length > 1 && (
            <div class="p-4 bg-dark-700/50 border-b border-dark-600">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm text-gray-400">Источник:</span>
                {tourData.value.available_sources.map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => {
                      selectedSource.value = source;
                      iframeLoading.value = true;
                    }}
                    class={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      selectedSource.value === source
                        ? 'bg-cyber-500 text-dark-900 font-medium'
                        : 'bg-dark-600 text-gray-300 hover:bg-dark-500'
                    }`}
                  >
                    {getSourceLabel(source)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Player */}
          {currentTour && (
            <div class="relative">
              {/* Loading overlay */}
              {iframeLoading.value && (
                <div class="absolute inset-0 bg-dark-800 flex items-center justify-center z-10">
                  <div class="text-center">
                    <div class="animate-spin text-4xl mb-2">🔄</div>
                    <p class="text-gray-400">Загрузка панорамы...</p>
                  </div>
                </div>
              )}

              {/* Iframe */}
              <iframe
                src={currentTour.url}
                class="w-full h-[400px] md:h-[500px] border-0"
                allowFullScreen
                loading="lazy"
                onLoad={() => { iframeLoading.value = false; }}
              />
            </div>
          )}

          {/* Footer info */}
          <div class="p-4 bg-dark-700/30 border-t border-dark-600">
            <div class="flex flex-wrap items-center justify-between gap-4">
              {currentTour?.address && (
                <div class="flex items-center gap-2 text-sm text-gray-400">
                  <span>📍</span>
                  <span>{currentTour.address}</span>
                </div>
              )}
              
              <div class="flex flex-wrap gap-2">
                {currentTour && (
                  <a
                    href={currentTour.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 px-3 py-1.5 bg-dark-600 text-gray-300 rounded-lg text-sm hover:bg-dark-500 transition-colors"
                  >
                    🔗 Открыть в новой вкладке
                  </a>
                )}
                
                {currentTour?.latitude && currentTour?.longitude && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${currentTour.latitude},${currentTour.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 px-3 py-1.5 bg-dark-600 text-gray-300 rounded-lg text-sm hover:bg-dark-500 transition-colors"
                  >
                    🗺️ На карте
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

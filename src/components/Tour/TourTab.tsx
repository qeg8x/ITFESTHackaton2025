/**
 * Вкладка 3D-тура для страницы университета
 */

import { useState, useEffect } from 'preact/hooks';
import TourPlayer from './TourPlayer.tsx';
import type { ThreeDTourProvider, ThreeDTourSource } from '../../types/university.ts';

interface TourTabProps {
  universityId: string;
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
  last_updated: string | null;
}

/**
 * Вкладка с 3D-туром университета
 */
export default function TourTab({ universityId }: TourTabProps) {
  const [tourData, setTourData] = useState<TourData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTour = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/universities/${universityId}/3d-tour`);

        if (response.ok) {
          const data = await response.json();
          setTourData(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || '3D-тур недоступен');
        }
      } catch (err) {
        console.error('Error loading tour:', err);
        setError('Ошибка загрузки 3D-тура');
      } finally {
        setLoading(false);
      }
    };

    loadTour();
  }, [universityId]);

  // Состояние загрузки
  if (loading) {
    return (
      <div class="flex flex-col items-center justify-center py-16">
        <div class="relative">
          <div class="w-16 h-16 border-4 border-dark-600 rounded-full animate-spin border-t-cyber-500" />
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-2xl">🎬</span>
          </div>
        </div>
        <p class="mt-4 text-gray-400">Загрузка 3D-тура...</p>
      </div>
    );
  }

  // Ошибка
  if (error) {
    return (
      <div class="flex flex-col items-center justify-center py-16">
        <div class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
          <span class="text-4xl">❌</span>
        </div>
        <h3 class="text-lg font-medium text-white mb-2">3D-тур недоступен</h3>
        <p class="text-gray-400 text-center max-w-md">
          {error}
        </p>
        <button
          type="button"
          onClick={() => globalThis.location.reload()}
          class="mt-4 px-4 py-2 bg-dark-700 border border-dark-600 text-gray-300 rounded-lg hover:bg-dark-600 transition-colors"
        >
          🔄 Попробовать снова
        </button>
      </div>
    );
  }

  // Нет данных
  if (!tourData || !tourData.available_sources?.length) {
    return (
      <div class="flex flex-col items-center justify-center py-16">
        <div class="w-20 h-20 bg-dark-700 rounded-full flex items-center justify-center mb-4">
          <span class="text-4xl">🎬</span>
        </div>
        <h3 class="text-lg font-medium text-white mb-2">3D-тур пока недоступен</h3>
        <p class="text-gray-400 text-center max-w-md">
          Мы работаем над добавлением виртуального тура для этого университета.
          Пожалуйста, проверьте позже.
        </p>
      </div>
    );
  }

  return (
    <div class="p-4 md:p-6">
      <TourPlayer tourData={tourData} />

      {/* Метаданные */}
      {tourData.last_updated && (
        <div class="mt-6 text-center">
          <p class="text-xs text-gray-500">
            Последнее обновление: {new Date(tourData.last_updated).toLocaleDateString('ru-RU')}
          </p>
        </div>
      )}
    </div>
  );
}

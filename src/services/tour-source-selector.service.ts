/**
 * Сервис выбора источника 3D-тура с fallback логикой
 */

import type { UniversityThreeDTour, ThreeDTourSource, ThreeDTourProvider } from '../types/university.ts';

/**
 * Результат выбора источника
 */
export interface SelectedSource {
  source: ThreeDTourProvider | null;
  data: ThreeDTourSource | null;
}

/**
 * Приоритет источников (Google > Yandex > 2GIS)
 */
const SOURCE_PRIORITY: ThreeDTourProvider[] = ['google', 'yandex', '2gis'];

/**
 * Маппинг источников к ключам в объекте тура
 */
const SOURCE_KEY_MAP: Record<ThreeDTourProvider, keyof UniversityThreeDTour> = {
  google: 'google_maps',
  yandex: 'yandex_panorama',
  '2gis': 'twogis',
};

/**
 * Сервис выбора источника 3D-тура
 */
export class TourSourceSelector {
  /**
   * Выбрать лучший доступный источник
   */
  selectBestSource(tourData: UniversityThreeDTour): SelectedSource {
    // Проверяем источники по приоритету
    for (const source of SOURCE_PRIORITY) {
      const key = SOURCE_KEY_MAP[source];
      const sourceData = tourData[key] as ThreeDTourSource | undefined;

      if (sourceData?.available) {
        return {
          source,
          data: sourceData,
        };
      }
    }

    // Fallback: вернуть первый доступный из списка
    if (tourData.available_sources?.length > 0) {
      const firstSource = tourData.available_sources[0];
      const key = SOURCE_KEY_MAP[firstSource];
      const sourceData = tourData[key] as ThreeDTourSource | undefined;

      return {
        source: firstSource,
        data: sourceData || null,
      };
    }

    return { source: null, data: null };
  }

  /**
   * Получить данные конкретного источника
   */
  getSourceData(tourData: UniversityThreeDTour, source: ThreeDTourProvider): ThreeDTourSource | null {
    const key = SOURCE_KEY_MAP[source];
    return (tourData[key] as ThreeDTourSource) || null;
  }

  /**
   * Получить цепочку fallback источников
   */
  getFallbackChain(tourData: UniversityThreeDTour): ThreeDTourProvider[] {
    const chain: ThreeDTourProvider[] = [];

    for (const source of SOURCE_PRIORITY) {
      const key = SOURCE_KEY_MAP[source];
      const sourceData = tourData[key] as ThreeDTourSource | undefined;

      if (sourceData?.available) {
        chain.push(source);
      }
    }

    return chain;
  }

  /**
   * Проверить доступность URL
   */
  async validateUrl(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 403 OK для некоторых сервисов (CORS protection)
      return response.ok || response.status === 403;
    } catch {
      return false;
    }
  }

  /**
   * Получить человекочитаемое название источника
   */
  getSourceLabel(source: ThreeDTourProvider): string {
    const labels: Record<ThreeDTourProvider, string> = {
      google: '🔵 Google Maps Street View',
      yandex: '🔴 Яндекс Панорамы',
      '2gis': '📍 2GIS Карты',
    };
    return labels[source];
  }

  /**
   * Проверить есть ли хоть один доступный источник
   */
  hasAvailableTour(tourData: UniversityThreeDTour | null | undefined): boolean {
    if (!tourData) return false;
    return tourData.available_sources?.length > 0;
  }
}

// Singleton instance
let selectorInstance: TourSourceSelector | null = null;

/**
 * Получить экземпляр селектора
 */
export const getTourSourceSelector = (): TourSourceSelector => {
  if (!selectorInstance) {
    selectorInstance = new TourSourceSelector();
  }
  return selectorInstance;
};

/**
 * Валидатор для 3D-туров
 */

import type { UniversityThreeDTour, ThreeDTourSource, ThreeDTourProvider } from '../types/university.ts';

/**
 * Допустимые домены для URL туров
 */
const VALID_DOMAINS: Record<ThreeDTourProvider, string[]> = {
  google: ['google.com', 'maps.google.com', 'goo.gl'],
  yandex: ['yandex.com', 'yandex.ru', 'yandex.kz', 'yandex.by'],
  '2gis': ['2gis.kz', '2gis.com', '2gis.ru'],
};

/**
 * Валидатор 3D-туров
 */
export class TourValidator {
  /**
   * Валидировать URL тура
   */
  static validateUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  }

  /**
   * Валидировать URL для конкретного источника
   */
  static validateSourceUrl(url: string, source: ThreeDTourProvider): boolean {
    if (!this.validateUrl(url)) return false;

    try {
      const domain = new URL(url).hostname.toLowerCase();
      const validDomains = VALID_DOMAINS[source];
      return validDomains.some(d => domain.includes(d));
    } catch {
      return false;
    }
  }

  /**
   * Валидировать координаты
   */
  static validateCoordinates(lat: number, lng: number): boolean {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;
    if (isNaN(lat) || isNaN(lng)) return false;
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  /**
   * Валидировать источник тура
   */
  static validateTourSource(source: ThreeDTourSource | null | undefined): boolean {
    if (!source) return true; // null/undefined допустимы
    
    if (!this.validateUrl(source.url)) return false;
    if (!this.validateCoordinates(source.latitude, source.longitude)) return false;
    
    return true;
  }

  /**
   * Валидировать полные данные 3D-тура
   */
  static validate3DTour(tour: UniversityThreeDTour | null | undefined): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!tour) {
      return { valid: true, errors: [] }; // Пустой тур допустим
    }

    // Проверить Google Maps
    if (tour.google_maps) {
      if (!this.validateTourSource(tour.google_maps)) {
        errors.push('Invalid Google Maps tour source');
      }
      if (tour.google_maps.url && !this.validateSourceUrl(tour.google_maps.url, 'google')) {
        errors.push('Google Maps URL domain is not valid');
      }
    }

    // Проверить Yandex Panorama
    if (tour.yandex_panorama) {
      if (!this.validateTourSource(tour.yandex_panorama)) {
        errors.push('Invalid Yandex Panorama tour source');
      }
      if (tour.yandex_panorama.url && !this.validateSourceUrl(tour.yandex_panorama.url, 'yandex')) {
        errors.push('Yandex Panorama URL domain is not valid');
      }
    }

    // Проверить 2GIS
    if (tour.twogis) {
      if (!this.validateTourSource(tour.twogis)) {
        errors.push('Invalid 2GIS tour source');
      }
      if (tour.twogis.url && !this.validateSourceUrl(tour.twogis.url, '2gis')) {
        errors.push('2GIS URL domain is not valid');
      }
    }

    // Проверить available_sources
    if (tour.available_sources && !Array.isArray(tour.available_sources)) {
      errors.push('available_sources must be an array');
    }

    // Проверить primary_source
    if (tour.primary_source) {
      const validSources: ThreeDTourProvider[] = ['google', 'yandex', '2gis'];
      if (!validSources.includes(tour.primary_source)) {
        errors.push('Invalid primary_source value');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Санитизировать данные тура
   */
  static sanitizeTour(tour: Partial<UniversityThreeDTour>): UniversityThreeDTour {
    const sanitized: UniversityThreeDTour = {
      available_sources: [],
    };

    if (tour.google_maps?.url && this.validateTourSource(tour.google_maps)) {
      sanitized.google_maps = { ...tour.google_maps };
      if (tour.google_maps.available) {
        sanitized.available_sources.push('google');
      }
    }

    if (tour.yandex_panorama?.url && this.validateTourSource(tour.yandex_panorama)) {
      sanitized.yandex_panorama = { ...tour.yandex_panorama };
      if (tour.yandex_panorama.available) {
        sanitized.available_sources.push('yandex');
      }
    }

    if (tour.twogis?.url && this.validateTourSource(tour.twogis)) {
      sanitized.twogis = { ...tour.twogis };
      if (tour.twogis.available) {
        sanitized.available_sources.push('2gis');
      }
    }

    // Установить primary_source
    if (tour.primary_source && sanitized.available_sources.includes(tour.primary_source)) {
      sanitized.primary_source = tour.primary_source;
    } else if (sanitized.available_sources.length > 0) {
      sanitized.primary_source = sanitized.available_sources[0];
    }

    sanitized.last_updated = tour.last_updated || new Date();

    return sanitized;
  }
}

/**
 * Валидации для 3D-туров кампусов
 */
import type {
  UniversityThreeDTour,
  ThreeDTourSource,
  ThreeDTourProvider,
} from '../types/university.ts';

const THREE_D_TOUR_SCHEMES: Record<ThreeDTourProvider, RegExp> = {
  google: /^https?:\/\/maps\.google\.\w+\/.*$/i,
  yandex: /^https?:\/\/yandex\.(ru|com)\/maps\/.*$/i,
  '2gis': /^https?:\/\/(go\.)?2gis\.\w+\/.*$/i,
};

const isValidCoordinate = (value: number, min: number, max: number): boolean => {
  return Number.isFinite(value) && value >= min && value <= max;
};

const isValidUrlByProvider = (source: ThreeDTourSource): boolean => {
  const validator = THREE_D_TOUR_SCHEMES[source.source];
  return validator.test(source.url);
};

/**
 * Проверить валидность отдельного источника 3D-тура
 */
export const validateThreeDTourSource = (source: ThreeDTourSource): boolean => {
  if (!source.url.startsWith('https://')) {
    return false;
  }

  if (!isValidUrlByProvider(source)) {
    return false;
  }

  if (!isValidCoordinate(source.latitude, -90, 90)) {
    return false;
  }

  if (!isValidCoordinate(source.longitude, -180, 180)) {
    return false;
  }

  return true;
};

/**
 * Проверить валидность всей структуры 3D-туров
 */
export const validateThreeDTour = (tour?: UniversityThreeDTour): boolean => {
  if (!tour) {
    return false;
  }

  const validatedSources = [tour.google_maps, tour.yandex_panorama, tour.twogis]
    .filter((source): source is ThreeDTourSource => Boolean(source))
    .filter((source) => validateThreeDTourSource(source));

  if (validatedSources.length === 0) {
    return false;
  }

  if (tour.primary_source && !tour.available_sources.includes(tour.primary_source)) {
    return false;
  }

  return true;
};

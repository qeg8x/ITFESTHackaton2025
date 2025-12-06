/**
 * Компонент карты университета
 * Использует Leaflet для отображения местоположения
 */

import { useEffect, useRef } from 'preact/hooks';
import { useSignal } from '@preact/signals';

interface UniversityMapProps {
  latitude?: number | null;
  longitude?: number | null;
  name: string;
  address?: string;
  className?: string;
}

/**
 * Карта с маркером университета
 * Если координат нет - компонент не рендерится
 */
export const UniversityMap = ({
  latitude,
  longitude,
  name,
  address,
  className = '',
}: UniversityMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const isLoaded = useSignal(false);
  const error = useSignal<string | null>(null);

  // Проверка наличия координат
  if (!latitude || !longitude) {
    return null;
  }

  // Инициализация карты
  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current) return;

    const loadMap = async () => {
      try {
        // Динамический импорт Leaflet (для SSR совместимости)
        const L = await import('https://esm.sh/leaflet@1.9.4');
        
        // Добавить CSS Leaflet
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Создать карту
        const map = L.map(mapContainerRef.current!, {
          center: [latitude, longitude],
          zoom: 15,
          scrollWheelZoom: false,
        });

        // Добавить тайлы OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        // Кастомная иконка маркера
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background: linear-gradient(135deg, #3b82f6, #8b5cf6);
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        // Добавить маркер
        const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);

        // Popup с информацией
        const popupContent = `
          <div style="min-width: 150px;">
            <strong style="font-size: 14px;">${name}</strong>
            ${address ? `<p style="margin: 4px 0 0; font-size: 12px; color: #666;">${address}</p>` : ''}
          </div>
        `;
        marker.bindPopup(popupContent);

        mapInstance.current = map;
        isLoaded.value = true;
      } catch (err) {
        console.error('Failed to load map:', err);
        error.value = 'Не удалось загрузить карту';
      }
    };

    loadMap();

    // Cleanup
    return () => {
      if (mapInstance.current) {
        (mapInstance.current as { remove: () => void }).remove();
        mapInstance.current = null;
      }
    };
  }, [latitude, longitude, name, address]);

  return (
    <div class={`relative ${className}`}>
      {/* Заголовок */}
      <div class="flex items-center gap-2 mb-3">
        <span class="text-lg">📍</span>
        <h3 class="font-semibold text-gray-900">Расположение</h3>
      </div>

      {/* Контейнер карты */}
      <div
        ref={mapContainerRef}
        class="w-full h-64 md:h-80 rounded-xl overflow-hidden border border-gray-200 bg-gray-100"
        style={{ minHeight: '250px' }}
      >
        {!isLoaded.value && !error.value && (
          <div class="flex items-center justify-center h-full">
            <div class="flex items-center gap-2 text-gray-500">
              <div class="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Загрузка карты...</span>
            </div>
          </div>
        )}

        {error.value && (
          <div class="flex items-center justify-center h-full text-red-500">
            {error.value}
          </div>
        )}
      </div>

      {/* Адрес под картой */}
      {address && (
        <p class="mt-2 text-sm text-gray-600">
          {address}
        </p>
      )}

      {/* Ссылка на внешнюю карту */}
      <a
        href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-700"
      >
        Открыть в OpenStreetMap
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
};

/**
 * Компонент-заглушка для статической карты (без JavaScript)
 */
export const UniversityMapStatic = ({
  latitude,
  longitude,
  name,
}: UniversityMapProps) => {
  if (!latitude || !longitude) {
    return null;
  }

  // Используем OpenStreetMap Static API через статический URL
  const staticMapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=14&size=600x300&maptype=mapnik&markers=${latitude},${longitude},red-pushpin`;

  return (
    <div class="relative">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-lg">📍</span>
        <h3 class="font-semibold text-gray-900">Расположение</h3>
      </div>

      <a
        href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`}
        target="_blank"
        rel="noopener noreferrer"
        class="block rounded-xl overflow-hidden border border-gray-200"
      >
        <img
          src={staticMapUrl}
          alt={`Карта: ${name}`}
          class="w-full h-64 object-cover"
          loading="lazy"
        />
      </a>
    </div>
  );
};

export default UniversityMap;

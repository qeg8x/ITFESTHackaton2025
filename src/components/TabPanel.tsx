/**
 * Контейнер для содержимого таба
 * Поддержка анимаций и сохранения scroll position
 */

import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

interface TabPanelProps {
  id: string;
  isActive: boolean;
  children: ComponentChildren;
}

/**
 * Панель содержимого таба с анимацией и сохранением scroll
 * @param id - Уникальный идентификатор панели
 * @param isActive - Активна ли панель
 * @param children - Содержимое панели
 */
export const TabPanel = ({ id, isActive, children }: TabPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef<Map<string, number>>(new Map());

  // Сохранение scroll position при деактивации
  useEffect(() => {
    if (!isActive && panelRef.current) {
      scrollPositions.current.set(id, panelRef.current.scrollTop);
    }
  }, [isActive, id]);

  // Восстановление scroll position при активации
  useEffect(() => {
    if (isActive && panelRef.current) {
      const savedPosition = scrollPositions.current.get(id) || 0;
      panelRef.current.scrollTop = savedPosition;
    }
  }, [isActive, id]);

  if (!isActive) return null;

  return (
    <div
      ref={panelRef}
      id={`tabpanel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      class="flex-1 overflow-y-auto animate-fade-in"
    >
      {children}
    </div>
  );
};

export default TabPanel;

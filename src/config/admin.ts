/**
 * Конфигурация админ-ключей
 */

import { logger } from '../utils/logger.ts';

/**
 * Информация об админе
 */
export interface AdminInfo {
  name: string;
  email?: string;
  permissions: AdminPermission[];
  createdAt?: string;
}

/**
 * Разрешения админа
 */
export type AdminPermission = 
  | 'read'           // Чтение данных
  | 'write'          // Изменение данных
  | 'delete'         // Удаление данных
  | 'parse'          // Запуск парсинга
  | 'manage_users'   // Управление пользователями
  | 'full_access';   // Полный доступ

/**
 * Конфигурация по умолчанию
 */
const _DEFAULT_ADMIN: AdminInfo = {
  name: 'Default Admin',
  permissions: ['full_access'],
};

/**
 * Получить все админ-ключи из окружения
 */
const getAdminKeys = (): Map<string, AdminInfo> => {
  const keys = new Map<string, AdminInfo>();
  
  // Основной ключ (обратная совместимость)
  const mainKey = Deno.env.get('ADMIN_KEY');
  if (mainKey) {
    keys.set(mainKey, {
      name: Deno.env.get('ADMIN_NAME') ?? 'Main Admin',
      email: Deno.env.get('ADMIN_EMAIL'),
      permissions: ['full_access'],
    });
  }

  // Дополнительные ключи (ADMIN_KEY_1, ADMIN_KEY_2, ...)
  for (let i = 1; i <= 10; i++) {
    const key = Deno.env.get(`ADMIN_KEY_${i}`);
    if (key) {
      const name = Deno.env.get(`ADMIN_NAME_${i}`) ?? `Admin ${i}`;
      const email = Deno.env.get(`ADMIN_EMAIL_${i}`);
      const permsStr = Deno.env.get(`ADMIN_PERMS_${i}`) ?? 'full_access';
      const permissions = permsStr.split(',').map(p => p.trim()) as AdminPermission[];
      
      keys.set(key, { name, email, permissions });
    }
  }

  // Попробовать загрузить JSON конфиг
  const adminNamesJson = Deno.env.get('ADMIN_NAMES');
  if (adminNamesJson) {
    try {
      const admins = JSON.parse(adminNamesJson) as Record<string, string | AdminInfo>;
      for (const [key, value] of Object.entries(admins)) {
        if (typeof value === 'string') {
          keys.set(key, { name: value, permissions: ['full_access'] });
        } else {
          keys.set(key, { 
            ...value, 
            permissions: value.permissions ?? ['full_access'] 
          });
        }
      }
    } catch (err) {
      logger.warn('Failed to parse ADMIN_NAMES JSON', { error: err });
    }
  }

  // Dev ключ по умолчанию (только в development)
  const isDev = Deno.env.get('DENO_ENV') !== 'production';
  if (isDev && keys.size === 0) {
    keys.set('dev-admin-key', {
      name: 'Development Admin',
      permissions: ['full_access'],
    });
    logger.warn('Using default dev-admin-key (development only)');
  }

  return keys;
};

// Кэш ключей
let adminKeysCache: Map<string, AdminInfo> | null = null;

/**
 * Получить кэшированные ключи
 */
const getCachedKeys = (): Map<string, AdminInfo> => {
  if (!adminKeysCache) {
    adminKeysCache = getAdminKeys();
    logger.info('Admin keys loaded', { count: adminKeysCache.size });
  }
  return adminKeysCache;
};

/**
 * Очистить кэш ключей (для перезагрузки)
 */
export const clearAdminKeysCache = (): void => {
  adminKeysCache = null;
};

/**
 * Проверить валидность админ-ключа
 * @param key - ключ для проверки
 * @returns true если ключ валиден
 */
export const validateAdminKey = (key: string | null | undefined): boolean => {
  if (!key) return false;
  return getCachedKeys().has(key);
};

/**
 * Получить информацию об админе по ключу
 * @param key - админ-ключ
 * @returns информация об админе или null
 */
export const getAdminInfo = (key: string | null | undefined): AdminInfo | null => {
  if (!key) return null;
  return getCachedKeys().get(key) ?? null;
};

/**
 * Проверить разрешение админа
 * @param key - админ-ключ
 * @param permission - требуемое разрешение
 * @returns true если разрешение есть
 */
export const hasPermission = (
  key: string | null | undefined,
  permission: AdminPermission
): boolean => {
  const admin = getAdminInfo(key);
  if (!admin) return false;
  
  // full_access включает все разрешения
  if (admin.permissions.includes('full_access')) return true;
  
  return admin.permissions.includes(permission);
};

/**
 * Замаскировать ключ для логов
 */
export const maskKey = (key: string | null | undefined): string => {
  if (!key) return '[none]';
  if (key.length <= 8) return '***';
  return key.substring(0, 4) + '...' + key.substring(key.length - 4);
};

/**
 * Получить количество админов
 */
export const getAdminCount = (): number => {
  return getCachedKeys().size;
};

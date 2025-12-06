/**
 * Middleware для аутентификации админов
 */

import { logger } from '../utils/logger.ts';
import { 
  validateAdminKey, 
  getAdminInfo, 
  hasPermission, 
  maskKey,
  type AdminInfo,
  type AdminPermission 
} from '../config/admin.ts';

/**
 * Результат проверки аутентификации
 */
export interface AuthResult {
  valid: boolean;
  adminKey: string | null;
  adminInfo: AdminInfo | null;
  error?: string;
}

/**
 * Защита от brute-force
 * Простой rate limiter в памяти
 */
const failedAttempts = new Map<string, { count: number; lastAttempt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 минута
const MAX_FAILED_ATTEMPTS = 10; // максимум попыток за окно

/**
 * Проверить rate limit для IP
 */
const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  
  if (!record) return true;
  
  // Очистить старые записи
  if (now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    failedAttempts.delete(ip);
    return true;
  }
  
  return record.count < MAX_FAILED_ATTEMPTS;
};

/**
 * Записать неудачную попытку
 */
const recordFailedAttempt = (ip: string): void => {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  
  if (!record || now - record.lastAttempt > RATE_LIMIT_WINDOW) {
    failedAttempts.set(ip, { count: 1, lastAttempt: now });
  } else {
    record.count++;
    record.lastAttempt = now;
  }
};

/**
 * Очистить запись после успешной авторизации
 */
const clearFailedAttempts = (ip: string): void => {
  failedAttempts.delete(ip);
};

/**
 * Получить IP из запроса
 */
const getClientIP = (req: Request): string => {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    ?? req.headers.get('x-real-ip') 
    ?? 'unknown';
};

/**
 * Извлечь админ-ключ из запроса
 */
const extractAdminKey = (req: Request): string | null => {
  // Проверить заголовки (разные варианты)
  const headerNames = ['X-Admin-Key', 'admin-key', 'Authorization'];
  
  for (const name of headerNames) {
    const value = req.headers.get(name);
    if (value) {
      // Для Authorization убрать префикс Bearer
      if (name === 'Authorization' && value.startsWith('Bearer ')) {
        return value.substring(7);
      }
      return value;
    }
  }
  
  // Проверить query параметр (менее безопасно, но для тестирования)
  const url = new URL(req.url);
  return url.searchParams.get('admin_key');
};

/**
 * Проверить аутентификацию админа
 * @param req - HTTP запрос
 * @returns результат проверки
 */
export const requireAdmin = (req: Request): AuthResult => {
  const ip = getClientIP(req);
  const adminKey = extractAdminKey(req);
  const maskedKey = maskKey(adminKey);
  
  // Rate limit check
  if (!checkRateLimit(ip)) {
    logger.warn('Rate limit exceeded', { ip, maskedKey });
    return {
      valid: false,
      adminKey: null,
      adminInfo: null,
      error: 'Too many failed attempts. Please try again later.',
    };
  }
  
  // Проверить ключ
  if (!adminKey) {
    logger.debug('Missing admin key', { ip });
    recordFailedAttempt(ip);
    return {
      valid: false,
      adminKey: null,
      adminInfo: null,
      error: 'Admin key is required',
    };
  }
  
  if (!validateAdminKey(adminKey)) {
    logger.warn('Invalid admin key attempt', { ip, maskedKey });
    recordFailedAttempt(ip);
    return {
      valid: false,
      adminKey: null,
      adminInfo: null,
      error: 'Invalid admin key',
    };
  }
  
  // Успешная авторизация
  const adminInfo = getAdminInfo(adminKey);
  clearFailedAttempts(ip);
  
  logger.debug('Admin authenticated', { 
    ip, 
    maskedKey, 
    adminName: adminInfo?.name 
  });
  
  return {
    valid: true,
    adminKey,
    adminInfo,
  };
};

/**
 * Проверить разрешение админа
 * @param req - HTTP запрос
 * @param permission - требуемое разрешение
 * @returns результат проверки
 */
export const requirePermission = (
  req: Request,
  permission: AdminPermission
): AuthResult => {
  const authResult = requireAdmin(req);
  
  if (!authResult.valid) {
    return authResult;
  }
  
  if (!hasPermission(authResult.adminKey, permission)) {
    logger.warn('Permission denied', { 
      maskedKey: maskKey(authResult.adminKey),
      permission,
      adminPermissions: authResult.adminInfo?.permissions,
    });
    return {
      ...authResult,
      valid: false,
      error: `Permission denied: ${permission}`,
    };
  }
  
  return authResult;
};

/**
 * Создать Response для неавторизованного доступа
 */
export const unauthorizedResponse = (error: string = 'Unauthorized'): Response => {
  return new Response(JSON.stringify({
    success: false,
    error,
    status: 401,
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * Создать Response для запрещённого доступа
 */
export const forbiddenResponse = (error: string = 'Forbidden'): Response => {
  return new Response(JSON.stringify({
    success: false,
    error,
    status: 403,
  }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
};

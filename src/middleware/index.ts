/**
 * Экспорт middleware
 */

export {
  requireAdmin,
  requirePermission,
  unauthorizedResponse,
  forbiddenResponse,
  type AuthResult,
} from './auth.ts';

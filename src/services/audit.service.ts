/**
 * Audit Service - логирование админ действий
 */

import { logger } from '../utils/logger.ts';
import { query } from '../config/database.ts';
import { maskKey } from '../config/admin.ts';

/**
 * Типы админ действий
 */
export type AdminActionType = 
  | 'create_university'
  | 'update_university'
  | 'delete_university'
  | 'update_profile'
  | 'patch_profile'
  | 'create_program'
  | 'update_program'
  | 'delete_program'
  | 'test_parser'
  | 'trigger_update'
  | 'view_data'
  | 'login_attempt'
  | 'other';

/**
 * Запись аудита
 */
export interface AuditRecord {
  id?: string;
  admin_key_masked: string;
  admin_name?: string;
  action: AdminActionType;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  success: boolean;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

/**
 * Логировать админ действие
 */
export const logAdminAction = async (
  adminKey: string | null,
  action: AdminActionType,
  details: {
    resourceType: string;
    resourceId?: string;
    data?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
    adminName?: string;
  },
  success: boolean,
  errorMessage?: string
): Promise<void> => {
  const maskedKey = maskKey(adminKey);
  const timestamp = new Date().toISOString();

  // Логируем в консоль
  const logData = {
    admin: maskedKey,
    adminName: details.adminName,
    action,
    resourceType: details.resourceType,
    resourceId: details.resourceId,
    success,
    error: errorMessage,
  };

  if (success) {
    logger.info('Admin action', logData);
  } else {
    logger.warn('Admin action failed', logData);
  }

  // Сохраняем в БД
  try {
    await query(
      `INSERT INTO update_logs (source_id, status, changes_detected, error_message, processing_time_ms)
       VALUES (
         (SELECT id FROM university_sources LIMIT 1), 
         $1, 
         $2, 
         $3, 
         0
       )`,
      [
        success ? 'success' : 'failed',
        true,
        JSON.stringify({
          type: 'admin_action',
          admin_key_masked: maskedKey,
          admin_name: details.adminName,
          action,
          resource_type: details.resourceType,
          resource_id: details.resourceId,
          details: details.data,
          ip: details.ip,
          timestamp,
        }),
      ]
    );
  } catch (err) {
    // Не падаем если аудит не записался
    logger.error('Failed to save audit log', { error: err });
  }
};

/**
 * Создать хелпер для логирования в роутах
 */
export const createAuditLogger = (req: Request, adminKey: string | null, adminName?: string) => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    ?? req.headers.get('x-real-ip') 
    ?? 'unknown';
  const userAgent = req.headers.get('user-agent') ?? undefined;

  return {
    log: async (
      action: AdminActionType,
      resourceType: string,
      resourceId?: string,
      data?: Record<string, unknown>,
      success: boolean = true,
      errorMessage?: string
    ) => {
      await logAdminAction(
        adminKey,
        action,
        { resourceType, resourceId, data, ip, userAgent, adminName },
        success,
        errorMessage
      );
    },

    success: async (
      action: AdminActionType,
      resourceType: string,
      resourceId?: string,
      data?: Record<string, unknown>
    ) => {
      await logAdminAction(
        adminKey,
        action,
        { resourceType, resourceId, data, ip, userAgent, adminName },
        true
      );
    },

    failure: async (
      action: AdminActionType,
      resourceType: string,
      errorMessage: string,
      resourceId?: string,
      data?: Record<string, unknown>
    ) => {
      await logAdminAction(
        adminKey,
        action,
        { resourceType, resourceId, data, ip, userAgent, adminName },
        false,
        errorMessage
      );
    },
  };
};

/**
 * Получить последние админ действия
 */
export const getRecentAdminActions = async (limit: number = 50): Promise<AuditRecord[]> => {
  const results = await query<{ error_message: string; created_at: string }>(
    `SELECT error_message, created_at
     FROM update_logs
     WHERE error_message LIKE '%"type":"admin_action"%'
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );

  return results.map((r) => {
    try {
      const data = JSON.parse(r.error_message);
      return {
        admin_key_masked: data.admin_key_masked,
        admin_name: data.admin_name,
        action: data.action,
        resource_type: data.resource_type,
        resource_id: data.resource_id,
        details: data.details,
        success: true,
        ip_address: data.ip,
        timestamp: data.timestamp ?? r.created_at,
      };
    } catch {
      return {
        admin_key_masked: 'unknown',
        action: 'other' as AdminActionType,
        resource_type: 'unknown',
        success: false,
        timestamp: r.created_at,
      };
    }
  });
};

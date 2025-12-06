/**
 * API endpoint для чат-бота
 * POST /api/chat
 */

import { FreshContext, Handlers } from '$fresh/server.ts';
import {
  generateChatbotResponse,
  checkChatRateLimit,
  validateMessage,
  type ChatMessage,
} from '../../src/services/chatbot.service.ts';
import { logger } from '../../src/utils/logger.ts';

/**
 * Получить IP адрес клиента
 */
const getClientIp = (req: Request, ctx: FreshContext): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return ctx.remoteAddr?.hostname || 'unknown';
};

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  language?: string;
  sessionId?: string;
}

export const handler: Handlers = {
  async POST(req: Request, ctx: FreshContext) {
    const startTime = Date.now();
    const ip = getClientIp(req, ctx);

    try {
      // Проверить rate limit
      if (!checkChatRateLimit(ip)) {
        logger.warn('Chat rate limit exceeded', { ip });
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            message: 'Please wait before sending another message',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
            },
          }
        );
      }

      // Парсинг body
      let body: ChatRequest;
      try {
        body = await req.json();
      } catch {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid JSON',
            message: 'Request body must be valid JSON',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const { message, history = [], language = 'ru' } = body;

      // Валидация сообщения
      const validation = validateMessage(message);
      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid message',
            message: validation.error,
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      logger.info('Chat request', {
        ip,
        messageLength: message.length,
        historyLength: history.length,
        language,
      });

      // Преобразовать историю
      const formattedHistory: ChatMessage[] = (history || []).map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
      }));

      // Генерировать ответ
      const response = await generateChatbotResponse(message, formattedHistory, language);

      const duration = Date.now() - startTime;
      logger.info('Chat response', {
        responseLength: response.length,
        duration,
      });

      return new Response(
        JSON.stringify({
          success: true,
          response,
          took_ms: duration,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      logger.error('Chat error', { ip, error: errorMessage, duration });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Chat failed',
          message: errorMessage,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

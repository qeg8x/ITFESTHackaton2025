/**
 * Сервис чат-бота с контекстом университетов
 */

import { logger } from '../utils/logger.ts';
import { callOllamaForText } from '../utils/ollama.client.ts';

/**
 * Сообщение чата
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Сессия чата
 */
export interface ChatSession {
  id: string;
  userId?: string;
  language: string;
  messages: ChatMessage[];
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Хранилище сессий
 */
const sessions = new Map<string, ChatSession>();

/**
 * Rate limiter для чата
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 минута

/**
 * Кэш частых ответов
 */
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 час

/**
 * Языковые настройки
 */
const LANGUAGE_CONFIG: Record<string, { name: string; greeting: string }> = {
  ru: {
    name: 'Russian',
    greeting: 'Привет! Я помощник по выбору университета. Чем могу помочь?',
  },
  kk: {
    name: 'Kazakh',
    greeting: 'Сәлем! Мен университет таңдау бойынша көмекшімін. Қалай көмектесе аламын?',
  },
  en: {
    name: 'English',
    greeting: 'Hello! I\'m a university advisor assistant. How can I help you?',
  },
};

/**
 * Проверить rate limit
 */
export const checkChatRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
};

/**
 * Валидировать сообщение
 */
export const validateMessage = (message: string): { valid: boolean; error?: string } => {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message is required' };
  }

  const trimmed = message.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'Message too long. Maximum 500 characters.' };
  }

  return { valid: true };
};

/**
 * Построить промпт для Ollama
 */
const buildChatPrompt = (
  message: string,
  history: ChatMessage[],
  language: string
): string => {
  const langConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.en;

  // Форматировать историю
  const historyText = history
    .slice(-10) // Последние 10 сообщений
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  return `You are a helpful university advisor bot, acting as a knowledgeable student counselor.
Your goal is to help users find the right university for them.

CRITICAL RULES:
1. You ONLY answer questions about universities, education, studying, programs, admissions, scholarships.
2. If user asks about anything NOT related to education (politics, sports, cooking, entertainment, etc),
   respond: "I specialize in university and education topics. Would you like to know about universities, programs, or admissions?"
3. You speak in ${langConfig.name}.
4. You are friendly, supportive, and encouraging.
5. You provide practical advice about studying, choosing universities, applications.
6. Keep responses concise (1-3 paragraphs, max 400 characters).
7. If you don't know specific details, suggest searching in our database.

${historyText ? `Conversation history:\n${historyText}\n` : ''}
User message: "${message}"

Respond naturally and helpfully in ${langConfig.name}:`;
};

/**
 * Генерировать ответ чат-бота
 * @param message - сообщение пользователя
 * @param history - история чата
 * @param language - язык (ru | kk | en)
 * @returns ответ бота
 */
export const generateChatbotResponse = async (
  message: string,
  history: ChatMessage[],
  language: string = 'ru'
): Promise<string> => {
  const startTime = Date.now();

  // Валидация
  const validation = validateMessage(message);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const normalizedMessage = message.trim().toLowerCase();

  // Проверить кэш для частых вопросов
  const cacheKey = `${normalizedMessage}:${language}`;
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug('Chat cache hit', { message: normalizedMessage.slice(0, 50) });
    return cached.response;
  }

  logger.info('Generating chatbot response', {
    messageLength: message.length,
    historyLength: history.length,
    language,
  });

  // Построить промпт и вызвать Ollama
  const prompt = buildChatPrompt(message, history, language);

  let response: string;
  try {
    response = await callOllamaForText(prompt);
  } catch (err) {
    logger.error('Chatbot generation failed', { error: err });
    
    // Fallback ответ
    if (language === 'ru') {
      return 'Извините, произошла ошибка. Попробуйте переформулировать вопрос.';
    } else if (language === 'kk') {
      return 'Кешіріңіз, қате орын алды. Сұрақты қайта құрып көріңіз.';
    }
    return 'Sorry, an error occurred. Please try rephrasing your question.';
  }

  // Обрезать ответ если слишком длинный
  if (response.length > 500) {
    response = response.slice(0, 497) + '...';
  }

  // Кэшировать ответ для простых вопросов
  if (history.length === 0 && normalizedMessage.length < 100) {
    responseCache.set(cacheKey, { response, timestamp: Date.now() });
  }

  const duration = Date.now() - startTime;
  logger.info('Chatbot response generated', {
    responseLength: response.length,
    duration,
  });

  return response;
};

/**
 * Создать новую сессию чата
 */
export const createChatSession = (language: string = 'ru', userId?: string): ChatSession => {
  const id = crypto.randomUUID();
  const now = new Date();

  const session: ChatSession = {
    id,
    userId,
    language,
    messages: [],
    createdAt: now,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 часа
  };

  sessions.set(id, session);
  return session;
};

/**
 * Получить сессию чата
 */
export const getChatSession = (sessionId: string): ChatSession | null => {
  const session = sessions.get(sessionId);
  if (!session) return null;

  // Проверить срок действия
  if (new Date() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
};

/**
 * Добавить сообщение в сессию
 */
export const addMessageToSession = (
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): void => {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.messages.push({
    role,
    content,
    timestamp: new Date(),
  });
};

/**
 * Очистить старые сессии
 */
export const cleanupExpiredSessions = (): number => {
  const now = new Date();
  let cleaned = 0;

  for (const [id, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(id);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug('Cleaned expired chat sessions', { count: cleaned });
  }

  return cleaned;
};

// Автоочистка каждый час
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

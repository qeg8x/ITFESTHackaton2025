/**
 * Главный компонент чат-окна
 */

import { useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { ChatHeader } from './ChatHeader.tsx';
import { MessageBubble } from './MessageBubble.tsx';
import { ChatInput } from './ChatInput.tsx';
import { TypingIndicator } from './TypingIndicator.tsx';

/**
 * Сообщение чата
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatWindowProps {
  language?: string;
}

/**
 * Окно чата с ассистентом
 */
export const ChatWindow = ({ language = 'ru' }: ChatWindowProps) => {
  const messages = useSignal<ChatMessage[]>([]);
  const input = useSignal('');
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Приветственное сообщение
  useEffect(() => {
    const greeting = language === 'ru'
      ? 'Привет! 👋 Я AI-ассистент по выбору университета. Задайте мне любой вопрос!'
      : language === 'kk'
      ? 'Сәлем! 👋 Мен университет таңдау бойынша AI көмекшімін. Кез келген сұрақ қойыңыз!'
      : 'Hello! 👋 I\'m an AI assistant for university selection. Ask me anything!';

    messages.value = [{
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
    }];
  }, [language]);

  // Автоскролл к новым сообщениям
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.value]);

  // Загрузить историю из sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          messages.value = parsed.map((m: ChatMessage) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Сохранять историю в sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('chat_history', JSON.stringify(messages.value));
    } catch {
      // Ignore
    }
  }, [messages.value]);

  // Отправка сообщения
  const handleSend = async () => {
    const text = input.value.trim();
    if (!text || loading.value) return;

    // Добавить сообщение пользователя
    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    messages.value = [...messages.value, userMessage];
    input.value = '';
    error.value = null;

    // Получить ответ от бота
    loading.value = true;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.value.slice(-10), // Последние 10 сообщений
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to get response');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      messages.value = [...messages.value, assistantMessage];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Произошла ошибка';
      
      // Добавить сообщение об ошибке
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: language === 'ru'
          ? 'Извините, произошла ошибка. Попробуйте ещё раз.'
          : language === 'kk'
          ? 'Кешіріңіз, қате орын алды. Қайталап көріңіз.'
          : 'Sorry, an error occurred. Please try again.',
        timestamp: new Date(),
      };
      messages.value = [...messages.value, errorMessage];
    } finally {
      loading.value = false;
    }
  };

  // Очистка истории
  const handleClear = () => {
    const greeting = language === 'ru'
      ? 'Привет! 👋 Чем могу помочь?'
      : language === 'kk'
      ? 'Сәлем! 👋 Қалай көмектесе аламын?'
      : 'Hello! 👋 How can I help you?';

    messages.value = [{
      role: 'assistant',
      content: greeting,
      timestamp: new Date(),
    }];
    sessionStorage.removeItem('chat_history');
  };

  return (
    <div class="flex flex-col h-full bg-dark-800 rounded-xl border border-dark-600 overflow-hidden">
      {/* Header */}
      <ChatHeader onClear={handleClear} language={language} />

      {/* Messages */}
      <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-dark-900">
        {messages.value.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        
        {loading.value && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        value={input.value}
        onChange={(v: string) => { input.value = v; }}
        onSend={handleSend}
        disabled={loading.value}
        language={language}
      />
    </div>
  );
};

export default ChatWindow;

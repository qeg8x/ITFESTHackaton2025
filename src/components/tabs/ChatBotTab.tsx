/**
 * Контейнер для функции "Чат-бот"
 * Интерфейс мессенджера для общения с AI
 */

import { useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * Tab контейнер для чат-бота
 */
export const ChatBotTab = () => {
  const messages = useSignal<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Привет! 👋 Я AI-ассистент по выбору университета. Задайте мне вопрос о любом университете, программе обучения или поступлении!',
      timestamp: new Date(),
    },
  ]);
  const inputValue = useSignal('');
  const isLoading = useSignal(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.value.length]);

  const handleSend = async () => {
    if (!inputValue.value.trim() || isLoading.value) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.value.trim(),
      timestamp: new Date(),
    };

    messages.value = [...messages.value, userMessage];
    const userInput = inputValue.value;
    inputValue.value = '';
    isLoading.value = true;

    try {
      // Вызов реального API чат-бота
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          history: messages.value.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })),
          language: 'ru',
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.success ? data.response : getPlaceholderResponse(userInput),
        timestamp: new Date(),
      };
      messages.value = [...messages.value, assistantMessage];
    } catch {
      // Fallback на placeholder если API недоступен
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getPlaceholderResponse(userInput),
        timestamp: new Date(),
      };
      messages.value = [...messages.value, assistantMessage];
    } finally {
      isLoading.value = false;
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    'Какие университеты есть в Казахстане?',
    'Сколько стоит обучение в MIT?',
    'Лучшие IT-программы в Европе',
    'Как поступить в Гарвард?',
  ];

  return (
    <div class="h-full flex flex-col bg-gray-50">
      {/* Messages Area */}
      <div class="flex-1 overflow-y-auto p-4">
        <div class="max-w-3xl mx-auto space-y-4">
          {messages.value.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          
          {/* Loading indicator */}
          {isLoading.value && (
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                🤖
              </div>
              <div class="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm">
                <div class="flex gap-1">
                  <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s" />
                  <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Questions (shown when only welcome message) */}
      {messages.value.length === 1 && (
        <div class="px-4 pb-2">
          <div class="max-w-3xl mx-auto">
            <p class="text-sm text-gray-500 mb-2">Попробуйте спросить:</p>
            <div class="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => { inputValue.value = q; }}
                  class="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div class="border-t border-gray-200 bg-white p-4">
        <div class="max-w-3xl mx-auto">
          <div class="flex gap-3">
            <input
              type="text"
              placeholder="Задайте вопрос..."
              value={inputValue.value}
              onInput={(e) => { inputValue.value = (e.target as HTMLInputElement).value; }}
              onKeyDown={handleKeyDown}
              disabled={isLoading.value}
              class="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none disabled:bg-gray-100"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.value.trim() || isLoading.value}
              class="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span class="hidden sm:inline">Отправить</span>
              <span class="sm:hidden">➤</span>
            </button>
          </div>
          <p class="text-xs text-gray-400 mt-2 text-center">
            AI может давать неточные ответы. Проверяйте важную информацию.
          </p>
        </div>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
}

/**
 * Компонент пузыря сообщения
 */
const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  return (
    <div class={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        class={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 ${
          isUser ? 'bg-gray-600' : 'bg-blue-600'
        }`}
      >
        {isUser ? '👤' : '🤖'}
      </div>
      <div
        class={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
          isUser
            ? 'bg-blue-600 text-white rounded-tr-none'
            : 'bg-white border border-gray-200 rounded-tl-none'
        }`}
      >
        <p class="whitespace-pre-wrap">{message.content}</p>
        <p
          class={`text-xs mt-2 ${
            isUser ? 'text-blue-200' : 'text-gray-400'
          }`}
        >
          {message.timestamp.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
};

/**
 * Placeholder ответы для демонстрации (будет заменено на реальный API)
 */
const getPlaceholderResponse = (query: string): string => {
  const loweredQuery = query.toLowerCase();
  
  if (loweredQuery.includes('казахстан')) {
    return 'В Казахстане есть множество отличных университетов! 🎓\n\n- Назарбаев Университет (Астана)\n- Казахский Национальный Университет им. аль-Фараби (Алматы)\n- КИМЭП (Алматы)\n- Казахстанско-Британский Технический Университет\n\nХотите узнать подробнее о каком-то из них?';
  }
  
  if (loweredQuery.includes('mit') || loweredQuery.includes('массачусетс')) {
    return 'MIT (Massachusetts Institute of Technology) — один из лучших технических вузов мира! 🏆\n\n💰 Стоимость обучения: ~$57,000/год\n📍 Расположение: Кембридж, США\n🎯 Рейтинг: топ-5 в мире\n\nМногие студенты получают финансовую помощь.';
  }
  
  if (loweredQuery.includes('гарвард') || loweredQuery.includes('harvard')) {
    return 'Поступление в Гарвард — серьёзный вызов, но это возможно! 🎯\n\n📋 Требования:\n- SAT/ACT тесты\n- Эссе и рекомендации\n- Внеучебные достижения\n- GPA выше 4.0\n\nПроцент принятия: около 3-4%. Подготовка начинается за 2-3 года.';
  }
  
  if (loweredQuery.includes('it') || loweredQuery.includes('программ')) {
    return 'Лучшие IT-программы в Европе 💻:\n\n1. ETH Zurich (Швейцария)\n2. TU Munich (Германия)\n3. KTH (Швеция)\n4. Delft (Нидерланды)\n5. EPFL (Швейцария)\n\nМногие программы на английском языке с возможностью стажировок.';
  }
  
  return 'Спасибо за вопрос! 🤔\n\nЯ пока работаю в демо-режиме. В полной версии я смогу:\n- Искать университеты по любым критериям\n- Сравнивать программы обучения\n- Рассчитывать шансы на поступление\n- Помогать с документами\n\nПопробуйте спросить про конкретный университет!';
};

export default ChatBotTab;

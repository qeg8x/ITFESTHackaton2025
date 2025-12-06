/**
 * Компонент пузыря сообщения
 */

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * Пузырь сообщения в чате
 */
export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('ru', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div class={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        class={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-cyber-500 text-dark-900 rounded-br-md'
            : 'bg-dark-700 text-gray-200 border border-dark-600 rounded-bl-md'
        }`}
      >
        {/* Avatar для ассистента */}
        {!isUser && (
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">🤖</span>
            <span class="text-xs font-medium text-gray-400">AI</span>
          </div>
        )}

        {/* Текст сообщения */}
        <p class="text-sm whitespace-pre-wrap break-words">{message.content}</p>

        {/* Время */}
        <p
          class={`text-xs mt-1 ${
            isUser ? 'text-dark-700' : 'text-gray-500'
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;

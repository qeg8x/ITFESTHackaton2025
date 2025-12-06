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
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
        }`}
      >
        {/* Avatar для ассистента */}
        {!isUser && (
          <div class="flex items-center gap-2 mb-1">
            <span class="text-lg">🤖</span>
            <span class="text-xs font-medium text-gray-500">Ассистент</span>
          </div>
        )}

        {/* Текст сообщения */}
        <p class="text-sm whitespace-pre-wrap break-words">{message.content}</p>

        {/* Время */}
        <p
          class={`text-xs mt-1 ${
            isUser ? 'text-blue-200' : 'text-gray-400'
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default MessageBubble;

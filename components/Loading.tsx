/**
 * Компонент загрузки
 */

interface LoadingProps {
  /** Размер спиннера */
  size?: 'sm' | 'md' | 'lg';
  /** Текст загрузки */
  text?: string;
  /** Полноэкранный режим */
  fullScreen?: boolean;
}

/**
 * Спиннер загрузки
 */
export const Loading = ({
  size = 'md',
  text,
  fullScreen = false,
}: LoadingProps) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div class="flex flex-col items-center justify-center gap-3">
      <div
        class={`${sizeClasses[size]} border-cyber-500 border-t-transparent rounded-full animate-spin`}
      />
      {text && <p class="text-gray-400 text-sm">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div class="fixed inset-0 bg-dark-900 bg-opacity-90 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

/**
 * Скелетон для карточки
 */
export const CardSkeleton = () => (
  <div class="bg-dark-800 rounded-lg border border-dark-600 p-6 animate-pulse">
    <div class="h-4 bg-dark-600 rounded w-3/4 mb-4" />
    <div class="h-3 bg-dark-600 rounded w-1/2 mb-2" />
    <div class="h-3 bg-dark-600 rounded w-2/3" />
  </div>
);

/**
 * Скелетон для профиля университета
 */
export const ProfileSkeleton = () => (
  <div class="animate-pulse">
    {/* Header */}
    <div class="bg-dark-800 rounded-lg border border-dark-600 p-6 mb-6">
      <div class="flex items-start gap-4">
        <div class="w-20 h-20 bg-dark-600 rounded-lg" />
        <div class="flex-1">
          <div class="h-6 bg-dark-600 rounded w-2/3 mb-2" />
          <div class="h-4 bg-dark-600 rounded w-1/3 mb-2" />
          <div class="h-4 bg-dark-600 rounded w-1/4" />
        </div>
      </div>
    </div>

    {/* Content blocks */}
    <div class="grid gap-6 md:grid-cols-2">
      <div class="bg-dark-800 rounded-lg border border-dark-600 p-6">
        <div class="h-5 bg-dark-600 rounded w-1/3 mb-4" />
        <div class="space-y-2">
          <div class="h-3 bg-dark-600 rounded w-full" />
          <div class="h-3 bg-dark-600 rounded w-5/6" />
          <div class="h-3 bg-dark-600 rounded w-4/5" />
        </div>
      </div>
      <div class="bg-dark-800 rounded-lg border border-dark-600 p-6">
        <div class="h-5 bg-dark-600 rounded w-1/3 mb-4" />
        <div class="space-y-2">
          <div class="h-3 bg-dark-600 rounded w-full" />
          <div class="h-3 bg-dark-600 rounded w-3/4" />
        </div>
      </div>
    </div>
  </div>
);

export default Loading;

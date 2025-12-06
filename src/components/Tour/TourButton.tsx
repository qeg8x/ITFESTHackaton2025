/**
 * Кнопка для открытия 3D-тура кампуса
 */

import { useState } from 'preact/hooks';

interface TourButtonProps {
  universityId: string;
  universityName: string;
  onOpenTour: () => void;
  hasTour?: boolean;
  variant?: 'primary' | 'secondary' | 'compact';
}

/**
 * Кнопка для запуска 3D-тура
 */
export default function TourButton({
  universityId,
  universityName,
  onOpenTour,
  hasTour = true,
  variant = 'primary',
}: TourButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!hasTour) return;

    setLoading(true);
    setError(null);

    try {
      // Проверить доступность тура
      const response = await fetch(`/api/universities/${universityId}/3d-tour`);

      if (response.ok) {
        onOpenTour();
      } else {
        const data = await response.json();
        setError(data.error || '3D-тур недоступен');
      }
    } catch (err) {
      setError('Ошибка загрузки 3D-тура');
      console.error('Error checking tour availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: `
      px-6 py-3 text-base
      bg-gradient-to-r from-cyber-500 to-neon-500
      text-dark-900 font-semibold
      hover:from-cyber-400 hover:to-neon-400
      hover:shadow-glow-cyber
      active:scale-95
    `,
    secondary: `
      px-4 py-2 text-sm
      bg-dark-700 border border-cyber-500/30
      text-cyber-400
      hover:bg-dark-600 hover:border-cyber-500/50
      hover:text-cyber-300
    `,
    compact: `
      px-3 py-1.5 text-xs
      bg-cyber-500/10 border border-cyber-500/20
      text-cyber-400
      hover:bg-cyber-500/20
    `,
  };

  return (
    <div class="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={!hasTour || loading}
        class={`${baseClasses} ${variantClasses[variant]}`}
        title={hasTour ? `Открыть 3D-тур ${universityName}` : '3D-тур недоступен'}
      >
        {loading ? (
          <>
            <span class="animate-spin">⏳</span>
            <span>Загрузка...</span>
          </>
        ) : (
          <>
            <span class="text-lg">🎬</span>
            <span>3D-Тур кампуса</span>
          </>
        )}
      </button>

      {error && (
        <span class="text-xs text-red-400 mt-1">
          ❌ {error}
        </span>
      )}

      {!hasTour && (
        <span class="text-xs text-gray-500">
          3D-тур пока недоступен
        </span>
      )}
    </div>
  );
}

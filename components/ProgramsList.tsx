import type { Program } from '../src/types/university.ts';

/**
 * Props для списка программ
 */
interface ProgramsListProps {
  programs: Program[];
  /** Компактный режим (без таблицы) */
  compact?: boolean;
}

/**
 * Форматирование уровня образования
 */
const formatDegreeLevel = (level: string): string => {
  const labels: Record<string, string> = {
    Bachelor: 'Бакалавриат',
    Master: 'Магистратура',
    PhD: 'Докторантура',
  };
  return labels[level] ?? level;
};

/**
 * Цвет бейджа для уровня образования
 */
const getDegreeBadgeColor = (level: string): string => {
  const colors: Record<string, string> = {
    Bachelor: 'bg-cyber-500/20 text-cyber-400 border border-cyber-500/30',
    Master: 'bg-neon-500/20 text-neon-400 border border-neon-500/30',
    PhD: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  };
  return colors[level] ?? 'bg-dark-600 text-gray-300 border border-dark-500';
};

/**
 * Форматирование стоимости
 */
const formatTuition = (tuition?: { amount?: number | null; currency?: string }): string => {
  if (!tuition || tuition.amount == null) return '—';
  
  const formatter = new Intl.NumberFormat('ru-RU');
  return `${formatter.format(tuition.amount)} ${tuition.currency ?? 'USD'}`;
};

/**
 * Таблица образовательных программ
 */
export const ProgramsList = ({ programs, compact = false }: ProgramsListProps) => {
  if (!programs || programs.length === 0) {
    return (
      <div class="text-center py-8 text-gray-400">
        <p>Информация о программах недоступна</p>
      </div>
    );
  }

  // Компактный режим - карточки
  if (compact) {
    return (
      <div class="space-y-3">
        {programs.map((program) => (
          <div
            key={program.id}
            class="border border-dark-600 bg-dark-700/50 rounded-lg p-4 hover:border-cyber-500/50 transition-colors"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <h4 class="font-medium text-white">{program.name}</h4>
                <p class="text-sm text-gray-400 mt-1">
                  {program.duration_years} года · {program.language}
                </p>
              </div>
              <span class={`px-2 py-1 text-xs font-medium rounded-full ${getDegreeBadgeColor(program.degree_level)}`}>
                {formatDegreeLevel(program.degree_level)}
              </span>
            </div>
            {program.tuition && (
              <p class="text-sm text-gray-400 mt-2">
                💰 {formatTuition(program.tuition)} / год
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Полный режим - таблица
  return (
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-dark-600">
            <th class="text-left py-3 px-4 font-medium text-gray-400">Программа</th>
            <th class="text-left py-3 px-4 font-medium text-gray-400">Уровень</th>
            <th class="text-left py-3 px-4 font-medium text-gray-400">Срок</th>
            <th class="text-left py-3 px-4 font-medium text-gray-400">Язык</th>
            <th class="text-right py-3 px-4 font-medium text-gray-400">Стоимость</th>
          </tr>
        </thead>
        <tbody>
          {programs.map((program) => (
            <tr
              key={program.id}
              class="border-b border-dark-700 hover:bg-dark-700/50 transition-colors"
            >
              <td class="py-3 px-4">
                <span class="font-medium text-white">{program.name}</span>
              </td>
              <td class="py-3 px-4">
                <span class={`px-2 py-1 text-xs font-medium rounded-full ${getDegreeBadgeColor(program.degree_level)}`}>
                  {formatDegreeLevel(program.degree_level)}
                </span>
              </td>
              <td class="py-3 px-4 text-gray-300">
                {program.duration_years} {program.duration_years === 1 ? 'год' : 'года'}
              </td>
              <td class="py-3 px-4 text-gray-300">{program.language}</td>
              <td class="py-3 px-4 text-right text-gray-300">
                {formatTuition(program.tuition)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Мобильная версия */}
      <div class="md:hidden space-y-3 mt-4">
        {programs.map((program) => (
          <div key={program.id} class="bg-dark-700/50 border border-dark-600 rounded-lg p-4">
            <div class="flex items-start justify-between">
              <h4 class="font-medium text-white">{program.name}</h4>
              <span class={`px-2 py-1 text-xs font-medium rounded-full ${getDegreeBadgeColor(program.degree_level)}`}>
                {formatDegreeLevel(program.degree_level)}
              </span>
            </div>
            <div class="mt-2 text-sm text-gray-400 space-y-1">
              <p>📅 {program.duration_years} года</p>
              <p>🌐 {program.language}</p>
              {program.tuition && <p>💰 {formatTuition(program.tuition)}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgramsList;

/**
 * Компонент визуализации сравнения по критерию
 */

interface ComparisonCriterion {
  name: string;
  nameRu: string;
  scoreA: number;
  scoreB: number;
  winner: 'A' | 'B' | 'Tie';
  explanation: string;
}

interface ComparisonBarProps {
  criterion: ComparisonCriterion;
  nameA: string;
  nameB: string;
}

/**
 * Бар сравнения двух университетов по критерию
 */
export const ComparisonBar = ({ criterion, nameA, nameB }: ComparisonBarProps) => {
  const total = criterion.scoreA + criterion.scoreB;
  const percentA = total > 0 ? (criterion.scoreA / total) * 100 : 50;
  const percentB = total > 0 ? (criterion.scoreB / total) * 100 : 50;

  const getWinnerStyle = () => {
    if (criterion.winner === 'A') return { a: 'bg-green-500', b: 'bg-red-400' };
    if (criterion.winner === 'B') return { a: 'bg-red-400', b: 'bg-green-500' };
    return { a: 'bg-blue-500', b: 'bg-blue-500' };
  };

  const colors = getWinnerStyle();

  return (
    <div class="bg-white rounded-lg p-4 border border-gray-100">
      {/* Название критерия */}
      <div class="text-center mb-3">
        <h4 class="font-medium text-gray-800">{criterion.nameRu || criterion.name}</h4>
      </div>

      {/* Баллы и бар */}
      <div class="flex items-center gap-3">
        {/* Балл A */}
        <div class="w-16 text-right">
          <span class={`text-lg font-bold ${criterion.winner === 'A' ? 'text-green-600' : 'text-gray-700'}`}>
            {criterion.scoreA}
          </span>
        </div>

        {/* Бар */}
        <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden flex">
          <div
            class={`h-full ${colors.a} transition-all duration-500`}
            style={{ width: `${percentA}%` }}
          />
          <div
            class={`h-full ${colors.b} transition-all duration-500`}
            style={{ width: `${percentB}%` }}
          />
        </div>

        {/* Балл B */}
        <div class="w-16 text-left">
          <span class={`text-lg font-bold ${criterion.winner === 'B' ? 'text-green-600' : 'text-gray-700'}`}>
            {criterion.scoreB}
          </span>
        </div>
      </div>

      {/* Победитель */}
      <div class="mt-2 text-center">
        {criterion.winner === 'A' && (
          <span class="text-xs text-green-600 font-medium">✓ {nameA}</span>
        )}
        {criterion.winner === 'B' && (
          <span class="text-xs text-green-600 font-medium">✓ {nameB}</span>
        )}
        {criterion.winner === 'Tie' && (
          <span class="text-xs text-blue-600 font-medium">= Ничья</span>
        )}
      </div>

      {/* Объяснение (при наведении) */}
      {criterion.explanation && (
        <p class="mt-2 text-xs text-gray-500 text-center italic">
          {criterion.explanation}
        </p>
      )}
    </div>
  );
};

export default ComparisonBar;

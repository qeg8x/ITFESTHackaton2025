/**
 * Компонент результатов сравнения
 */

import type { BattleResult } from '../../services/university-battle.service.ts';
import { ComparisonBar } from './ComparisonBar.tsx';
import { BattleStats } from './BattleStats.tsx';

interface BattleResultsProps {
  result: BattleResult;
}

/**
 * Результаты Battle Mode
 */
export const BattleResults = ({ result }: BattleResultsProps) => {
  const { universityA, universityB, criteria } = result;

  return (
    <div class="space-y-6">
      {/* Header с университетами */}
      <div class="grid md:grid-cols-3 gap-4">
        {/* University A Card */}
        <UniversityCard
          university={universityA}
          isWinner={result.overallWinner === 'A'}
          side="left"
        />

        {/* VS */}
        <div class="flex items-center justify-center">
          <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full font-bold text-xl shadow-lg">
            VS
          </div>
        </div>

        {/* University B Card */}
        <UniversityCard
          university={universityB}
          isWinner={result.overallWinner === 'B'}
          side="right"
        />
      </div>

      {/* Criteria Comparison */}
      <div class="bg-gray-50 rounded-xl p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 text-center">
          📊 Сравнение по критериям
        </h3>
        <div class="space-y-4">
          {criteria.map((criterion) => (
            <ComparisonBar
              key={criterion.name}
              criterion={criterion}
              nameA={universityA.name}
              nameB={universityB.name}
            />
          ))}
        </div>
      </div>

      {/* Stats and Summary */}
      <BattleStats result={result} />
    </div>
  );
};

interface UniversityCardProps {
  university: {
    id: string;
    name: string;
    country: string;
    city: string;
    totalScore: number;
  };
  isWinner: boolean;
  side: 'left' | 'right';
}

/**
 * Карточка университета в результатах
 */
const UniversityCard = ({ university, isWinner, side }: UniversityCardProps) => {
  const borderColor = isWinner ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white';
  const alignment = side === 'left' ? 'text-left' : 'text-right';

  return (
    <div class={`rounded-xl p-4 border-2 ${borderColor} transition-all duration-300`}>
      {isWinner && (
        <div class={`mb-2 ${alignment}`}>
          <span class="text-2xl">🏆</span>
        </div>
      )}
      <h4 class={`font-bold text-lg text-gray-900 ${alignment}`}>
        {university.name}
      </h4>
      <p class={`text-sm text-gray-500 mt-1 ${alignment}`}>
        📍 {university.country}, {university.city}
      </p>
      <div class={`mt-3 ${alignment}`}>
        <span class="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
          Общий балл: {university.totalScore}
        </span>
      </div>
    </div>
  );
};

export default BattleResults;

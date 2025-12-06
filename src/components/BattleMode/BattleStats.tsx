/**
 * Компонент общей статистики сравнения
 */

import type { BattleResult } from '../../services/university-battle.service.ts';

interface BattleStatsProps {
  result: BattleResult;
}

/**
 * Статистика Battle Mode
 */
export const BattleStats = ({ result }: BattleStatsProps) => {
  const { universityA, universityB, overallWinner, winsA, winsB, ties, strengthsA, strengthsB, recommendation } = result;

  const winnerName = overallWinner === 'A' ? universityA.name : overallWinner === 'B' ? universityB.name : null;

  return (
    <div class="space-y-6">
      {/* Overall Winner */}
      <div class="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200 text-center">
        {overallWinner === 'Tie' ? (
          <>
            <span class="text-4xl">🤝</span>
            <h3 class="text-2xl font-bold text-gray-800 mt-2">Ничья!</h3>
            <p class="text-gray-600 mt-1">Оба университета показали равные результаты</p>
          </>
        ) : (
          <>
            <span class="text-4xl">🏆</span>
            <h3 class="text-2xl font-bold text-gray-800 mt-2">Победитель</h3>
            <p class="text-xl font-semibold text-yellow-700 mt-1">{winnerName}</p>
          </>
        )}
      </div>

      {/* Score Summary */}
      <div class="grid grid-cols-3 gap-4">
        <div class={`rounded-xl p-4 text-center ${overallWinner === 'A' ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'}`}>
          <p class="text-3xl font-bold text-gray-800">{winsA}</p>
          <p class="text-sm text-gray-600 mt-1">побед</p>
          <p class="text-xs text-gray-500 mt-1 truncate">{universityA.name}</p>
        </div>

        <div class="bg-blue-50 rounded-xl p-4 text-center">
          <p class="text-3xl font-bold text-blue-600">{ties}</p>
          <p class="text-sm text-gray-600 mt-1">ничьих</p>
        </div>

        <div class={`rounded-xl p-4 text-center ${overallWinner === 'B' ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'}`}>
          <p class="text-3xl font-bold text-gray-800">{winsB}</p>
          <p class="text-sm text-gray-600 mt-1">побед</p>
          <p class="text-xs text-gray-500 mt-1 truncate">{universityB.name}</p>
        </div>
      </div>

      {/* Strengths */}
      <div class="grid md:grid-cols-2 gap-4">
        {/* Strengths A */}
        <div class="bg-blue-50 rounded-xl p-4">
          <h4 class="font-semibold text-blue-800 mb-2">
            💪 Сильные стороны: {universityA.name}
          </h4>
          <ul class="space-y-1">
            {strengthsA.map((strength, i) => (
              <li key={i} class="text-sm text-gray-700 flex items-start gap-2">
                <span class="text-blue-500">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>

        {/* Strengths B */}
        <div class="bg-red-50 rounded-xl p-4">
          <h4 class="font-semibold text-red-800 mb-2">
            💪 Сильные стороны: {universityB.name}
          </h4>
          <ul class="space-y-1">
            {strengthsB.map((strength, i) => (
              <li key={i} class="text-sm text-gray-700 flex items-start gap-2">
                <span class="text-red-500">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div class="bg-purple-50 rounded-xl p-4">
          <h4 class="font-semibold text-purple-800 mb-2">📝 Рекомендация</h4>
          <p class="text-gray-700">{recommendation}</p>
        </div>
      )}
    </div>
  );
};

export default BattleStats;

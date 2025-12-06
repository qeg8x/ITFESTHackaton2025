/**
 * Вкладка: Рейтинги
 */

import { InputField } from './FormFields.tsx';
import type { Ranking } from '../../../src/types/university.ts';

interface Props {
  rankings: Ranking[];
  onUpdate: (rankings: Ranking[]) => void;
}

/**
 * Редактор рейтингов университета
 */
export default function RankingsTab({ rankings, onUpdate }: Props) {
  const addRanking = () => {
    const newRanking: Ranking = {
      source: 'QS World University Rankings',
      rank: undefined,
      year: new Date().getFullYear(),
      category: 'Overall',
    };
    onUpdate([...rankings, newRanking]);
  };

  const updateRanking = (index: number, updates: Partial<Ranking>) => {
    onUpdate(rankings.map((r, i) => i === index ? { ...r, ...updates } : r));
  };

  const deleteRanking = (index: number) => {
    if (confirm('Удалить рейтинг?')) {
      onUpdate(rankings.filter((_, i) => i !== index));
    }
  };

  return (
    <div class="space-y-4">
      <div class="flex justify-between items-center border-b pb-2">
        <h3 class="text-lg font-medium">Рейтинги ({rankings.length})</h3>
        <button 
          type="button" 
          onClick={addRanking}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + Добавить рейтинг
        </button>
      </div>

      {rankings.length === 0 ? (
        <p class="text-gray-500 text-center py-8">Нет рейтингов</p>
      ) : (
        <div class="space-y-3">
          {rankings.map((r, idx) => (
            <div key={idx} class="border rounded-lg p-4">
              <div class="flex justify-between mb-3">
                <span class="font-medium">Рейтинг #{idx + 1}</span>
                <button 
                  type="button" 
                  onClick={() => deleteRanking(idx)}
                  class="text-red-600 text-sm hover:text-red-800"
                >
                  🗑️ Удалить
                </button>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                <InputField
                  label="Источник"
                  value={r.source}
                  onChange={(v) => updateRanking(idx, { source: v })}
                />
                <InputField
                  label="Позиция"
                  type="number"
                  value={r.rank?.toString() || ''}
                  onChange={(v) => updateRanking(idx, { rank: v ? parseInt(v) : undefined })}
                />
                <InputField
                  label="Год"
                  type="number"
                  value={r.year.toString()}
                  onChange={(v) => updateRanking(idx, { year: parseInt(v) || new Date().getFullYear() })}
                />
                <InputField
                  label="Категория"
                  value={r.category}
                  onChange={(v) => updateRanking(idx, { category: v })}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

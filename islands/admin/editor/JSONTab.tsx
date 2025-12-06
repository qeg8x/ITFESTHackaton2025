/**
 * Вкладка: Редактирование JSON напрямую
 */

import { useState, useEffect } from 'preact/hooks';
import type { University } from '../../../src/types/university.ts';

interface Props {
  data: University;
  onChange: (data: University) => void;
}

/**
 * Редактор JSON для полного контроля
 */
export default function JSONTab({ data, onChange }: Props) {
  const [text, setText] = useState(JSON.stringify(data, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setText(JSON.stringify(data, null, 2));
  }, [data]);

  const handleChange = (value: string) => {
    setText(value);
    try {
      const parsed = JSON.parse(value);
      onChange(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError('Некорректный JSON: ' + (e as Error).message);
    }
  };

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(text);
      setText(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch {
      // Ignore - error already shown
    }
  };

  return (
    <div class="space-y-4">
      <div class="flex justify-between items-center border-b pb-2">
        <h3 class="text-lg font-medium">Редактирование JSON</h3>
        <button
          type="button"
          onClick={formatJSON}
          class="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
        >
          Форматировать
        </button>
      </div>
      
      {jsonError && (
        <div class="p-3 bg-red-50 text-red-700 rounded text-sm">{jsonError}</div>
      )}
      
      <textarea
        value={text}
        onInput={(e) => handleChange((e.target as HTMLTextAreaElement).value)}
        class={`w-full h-[500px] p-4 font-mono text-sm border rounded-lg ${
          jsonError ? 'border-red-500' : 'border-gray-300'
        } focus:ring-2 focus:ring-blue-500`}
        spellcheck={false}
      />
      
      <p class="text-xs text-gray-500">
        Редактируйте JSON напрямую для доступа ко всем полям. Изменения применяются автоматически при валидном JSON.
      </p>
    </div>
  );
}

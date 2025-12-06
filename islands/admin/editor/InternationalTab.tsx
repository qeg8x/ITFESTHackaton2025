/**
 * Вкладка: Международное
 */

import { InputField, TextAreaField, CheckboxField } from './FormFields.tsx';
import type { International } from '../../../src/types/university.ts';

interface Props {
  international: International;
  updateField: (path: string, value: unknown) => void;
}

/**
 * Форма редактирования международной информации
 */
export default function InternationalTab({ international, updateField }: Props) {
  return (
    <div class="space-y-6">
      <h3 class="text-lg font-medium border-b pb-2">Для международных студентов</h3>
      
      <CheckboxField
        label="Принимает международных студентов"
        checked={international.accepts_international}
        onChange={(v) => updateField('international.accepts_international', v)}
      />

      <InputField
        label="Процент иностранных студентов"
        type="number"
        value={international.international_percentage?.toString() || ''}
        onChange={(v) => updateField('international.international_percentage', v ? parseInt(v) : null)}
      />

      <TextAreaField
        label="Визовая поддержка"
        value={international.visa_support || ''}
        onChange={(v) => updateField('international.visa_support', v)}
        rows={2}
      />

      <TextAreaField
        label="Программы обмена"
        value={international.exchange_programs || ''}
        onChange={(v) => updateField('international.exchange_programs', v)}
        rows={2}
      />

      <InputField
        label="Языки обучения (через запятую)"
        value={international.languages_of_instruction?.join(', ') || ''}
        onChange={(v) => updateField('international.languages_of_instruction', v.split(',').map(s => s.trim()).filter(Boolean))}
      />
    </div>
  );
}

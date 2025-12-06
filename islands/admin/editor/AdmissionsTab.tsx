/**
 * Вкладка: Поступление
 */

import { InputField, TextAreaField } from './FormFields.tsx';
import type { Admissions } from '../../../src/types/university.ts';

interface Props {
  admissions: Admissions;
  updateField: (path: string, value: unknown) => void;
}

/**
 * Форма редактирования информации о поступлении
 */
export default function AdmissionsTab({ admissions, updateField }: Props) {
  return (
    <div class="space-y-6">
      <h3 class="text-lg font-medium border-b pb-2">Информация о поступлении</h3>
      
      <TextAreaField
        label="Общие требования"
        value={admissions.requirements || ''}
        onChange={(v) => updateField('admissions.requirements', v)}
        rows={3}
      />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextAreaField
          label="Требования к английскому"
          value={admissions.english_proficiency || ''}
          onChange={(v) => updateField('admissions.english_proficiency', v)}
          rows={2}
        />
        <TextAreaField
          label="Требуемые тесты"
          value={admissions.test_requirements || ''}
          onChange={(v) => updateField('admissions.test_requirements', v)}
          rows={2}
        />
      </div>

      <TextAreaField
        label="Необходимые документы"
        value={admissions.documents_needed || ''}
        onChange={(v) => updateField('admissions.documents_needed', v)}
        rows={3}
      />

      <TextAreaField
        label="Процесс подачи заявки"
        value={admissions.application_process || ''}
        onChange={(v) => updateField('admissions.application_process', v)}
        rows={3}
      />

      <InputField
        label="Даты набора"
        value={admissions.intake_dates || ''}
        onChange={(v) => updateField('admissions.intake_dates', v)}
      />
    </div>
  );
}

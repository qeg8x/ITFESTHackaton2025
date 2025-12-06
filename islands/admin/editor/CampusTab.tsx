/**
 * Вкладка: Кампус и дополнительная информация
 */

import { InputField, TextAreaField } from './FormFields.tsx';
import type { Campus, Other } from '../../../src/types/university.ts';

interface Props {
  campus: Campus;
  other: Other;
  updateField: (path: string, value: unknown) => void;
}

/**
 * Форма редактирования информации о кампусе
 */
export default function CampusTab({ campus, other, updateField }: Props) {
  return (
    <div class="space-y-6">
      <h3 class="text-lg font-medium border-b pb-2">Кампус и инфраструктура</h3>
      
      <InputField
        label="Расположение"
        value={campus.location || ''}
        onChange={(v) => updateField('campus.location', v)}
      />

      <TextAreaField
        label="Инфраструктура"
        value={campus.facilities || ''}
        onChange={(v) => updateField('campus.facilities', v)}
        rows={3}
      />

      <TextAreaField
        label="Общежитие / Проживание"
        value={campus.accommodation || ''}
        onChange={(v) => updateField('campus.accommodation', v)}
        rows={3}
      />

      <TextAreaField
        label="Студенческая жизнь"
        value={campus.student_life || ''}
        onChange={(v) => updateField('campus.student_life', v)}
        rows={3}
      />

      {/* Дополнительно */}
      <div class="pt-4 border-t">
        <h4 class="text-md font-medium mb-4">Дополнительная информация</h4>
        
        <TextAreaField
          label="Аккредитации"
          value={other.accreditations || ''}
          onChange={(v) => updateField('other.accreditations', v)}
          rows={2}
        />

        <div class="mt-4">
          <TextAreaField
            label="Известные выпускники"
            value={other.notable_alumni || ''}
            onChange={(v) => updateField('other.notable_alumni', v)}
            rows={2}
          />
        </div>

        <div class="mt-4">
          <TextAreaField
            label="Научные направления"
            value={other.research_focus || ''}
            onChange={(v) => updateField('other.research_focus', v)}
            rows={2}
          />
        </div>

        <div class="mt-4">
          <TextAreaField
            label="Специальные программы"
            value={other.special_programs || ''}
            onChange={(v) => updateField('other.special_programs', v)}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

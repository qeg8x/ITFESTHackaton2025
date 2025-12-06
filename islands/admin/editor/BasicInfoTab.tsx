/**
 * Вкладка: Основная информация университета
 */

import { InputField, TextAreaField } from './FormFields.tsx';
import type { University } from '../../../src/types/university.ts';

interface Props {
  university: University;
  updateField: (path: string, value: unknown) => void;
}

/**
 * Форма редактирования основной информации
 */
export default function BasicInfoTab({ university, updateField }: Props) {
  return (
    <div class="space-y-6">
      <h3 class="text-lg font-medium border-b pb-2">Основная информация</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Название"
          value={university.name}
          onChange={(v) => updateField('name', v)}
          required
        />
        <InputField
          label="Название (EN)"
          value={university.name_en || ''}
          onChange={(v) => updateField('name_en', v)}
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField
          label="Страна"
          value={university.country}
          onChange={(v) => updateField('country', v)}
          required
        />
        <InputField
          label="Город"
          value={university.city}
          onChange={(v) => updateField('city', v)}
          required
        />
        <InputField
          label="Год основания"
          type="number"
          value={university.founded_year?.toString() || ''}
          onChange={(v) => updateField('founded_year', v ? parseInt(v) : null)}
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Сайт"
          type="url"
          value={university.website_url}
          onChange={(v) => updateField('website_url', v)}
        />
        <InputField
          label="Логотип (URL)"
          type="url"
          value={university.logo_url || ''}
          onChange={(v) => updateField('logo_url', v)}
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField
          label="Количество студентов"
          type="number"
          value={university.student_count?.toString() || ''}
          onChange={(v) => updateField('student_count', v ? parseInt(v) : null)}
        />
        <InputField
          label="Количество преподавателей"
          type="number"
          value={university.faculty_count?.toString() || ''}
          onChange={(v) => updateField('faculty_count', v ? parseInt(v) : null)}
        />
      </div>

      <TextAreaField
        label="Описание"
        value={university.description}
        onChange={(v) => updateField('description', v)}
        rows={4}
      />

      <TextAreaField
        label="Миссия"
        value={university.mission || ''}
        onChange={(v) => updateField('mission', v)}
        rows={3}
      />
    </div>
  );
}

/**
 * Вкладка: Стоимость и стипендии
 */

import { InputField, TextAreaField } from './FormFields.tsx';
import type { TuitionGeneral, Scholarship } from '../../../src/types/university.ts';

interface Props {
  tuitionGeneral: TuitionGeneral;
  scholarships: Scholarship[];
  updateField: (path: string, value: unknown) => void;
}

/**
 * Форма редактирования стоимости и стипендий
 */
export default function TuitionTab({ tuitionGeneral, scholarships, updateField }: Props) {
  const addScholarship = () => {
    const newScholarship: Scholarship = {
      name: 'Новая стипендия',
      amount: '',
      eligibility: '',
      description: '',
    };
    updateField('scholarships', [...scholarships, newScholarship]);
  };

  const updateScholarship = (index: number, updates: Partial<Scholarship>) => {
    const updated = scholarships.map((s, i) => i === index ? { ...s, ...updates } : s);
    updateField('scholarships', updated);
  };

  const deleteScholarship = (index: number) => {
    if (confirm('Удалить стипендию?')) {
      updateField('scholarships', scholarships.filter((_, i) => i !== index));
    }
  };

  return (
    <div class="space-y-6">
      <h3 class="text-lg font-medium border-b pb-2">Стоимость обучения</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextAreaField
          label="Для иностранных студентов"
          value={tuitionGeneral.international_students || ''}
          onChange={(v) => updateField('tuition_general.international_students', v)}
          rows={2}
        />
        <TextAreaField
          label="Для местных студентов"
          value={tuitionGeneral.domestic_students || ''}
          onChange={(v) => updateField('tuition_general.domestic_students', v)}
          rows={2}
        />
      </div>

      <TextAreaField
        label="Варианты оплаты"
        value={tuitionGeneral.payment_options || ''}
        onChange={(v) => updateField('tuition_general.payment_options', v)}
        rows={2}
      />

      <TextAreaField
        label="Финансовая помощь"
        value={tuitionGeneral.financial_aid || ''}
        onChange={(v) => updateField('tuition_general.financial_aid', v)}
        rows={2}
      />

      {/* Стипендии */}
      <div class="pt-4 border-t">
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-md font-medium">Стипендии ({scholarships.length})</h4>
          <button 
            type="button" 
            onClick={addScholarship}
            class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            + Добавить
          </button>
        </div>

        {scholarships.length === 0 ? (
          <p class="text-gray-500 text-center py-4">Нет стипендий</p>
        ) : (
          <div class="space-y-4">
            {scholarships.map((s, idx) => (
              <div key={idx} class="border rounded-lg p-4">
                <div class="flex justify-between mb-2">
                  <span class="font-medium">Стипендия #{idx + 1}</span>
                  <button 
                    type="button" 
                    onClick={() => deleteScholarship(idx)}
                    class="text-red-600 text-sm hover:text-red-800"
                  >
                    🗑️ Удалить
                  </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InputField
                    label="Название"
                    value={s.name}
                    onChange={(v) => updateScholarship(idx, { name: v })}
                  />
                  <InputField
                    label="Сумма"
                    value={s.amount || ''}
                    onChange={(v) => updateScholarship(idx, { amount: v })}
                  />
                </div>
                <div class="mt-3">
                  <InputField
                    label="Условия получения"
                    value={s.eligibility || ''}
                    onChange={(v) => updateScholarship(idx, { eligibility: v })}
                  />
                </div>
                <div class="mt-3">
                  <TextAreaField
                    label="Описание"
                    value={s.description || ''}
                    onChange={(v) => updateScholarship(idx, { description: v })}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

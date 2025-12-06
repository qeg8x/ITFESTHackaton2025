/**
 * Вкладка: Образовательные программы
 */

import { useState } from 'preact/hooks';
import { InputField, TextAreaField, SelectField } from './FormFields.tsx';
import type { Program } from '../../../src/types/university.ts';

interface Props {
  programs: Program[];
  onUpdate: (programs: Program[]) => void;
}

/**
 * Редактор программ университета
 */
export default function ProgramsTab({ programs, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addProgram = () => {
    const newProg: Program = {
      id: `prog-${Date.now()}`,
      name: 'Новая программа',
      degree_level: 'Bachelor',
      duration_years: 4,
      language: 'Русский',
    };
    onUpdate([...programs, newProg]);
    setEditingId(newProg.id);
    setExpandedId(newProg.id);
  };

  const updateProgram = (id: string, updates: Partial<Program>) => {
    onUpdate(programs.map((p) => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProgram = (id: string) => {
    if (confirm('Удалить программу?')) {
      onUpdate(programs.filter((p) => p.id !== id));
    }
  };

  return (
    <div class="space-y-4">
      <div class="flex justify-between items-center border-b pb-2">
        <h3 class="text-lg font-medium">Образовательные программы ({programs.length})</h3>
        <button 
          type="button" 
          onClick={addProgram} 
          class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          + Добавить программу
        </button>
      </div>

      {programs.length === 0 ? (
        <p class="text-gray-500 text-center py-8">Нет программ. Добавьте первую программу.</p>
      ) : (
        <div class="space-y-3">
          {programs.map((prog) => (
            <div key={prog.id} class="border rounded-lg overflow-hidden">
              {/* Header */}
              <div 
                class="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
                onClick={() => setExpandedId(expandedId === prog.id ? null : prog.id)}
              >
                <div>
                  <div class="font-medium">{prog.name}</div>
                  <div class="text-sm text-gray-500">
                    {prog.degree_level} · {prog.duration_years} год(а) · {prog.language}
                  </div>
                </div>
                <div class="flex gap-2">
                  <button 
                    type="button" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setEditingId(editingId === prog.id ? null : prog.id); 
                      setExpandedId(prog.id); 
                    }}
                    class="text-blue-600 hover:text-blue-800 p-1"
                    title="Редактировать"
                  >
                    ✏️
                  </button>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); deleteProgram(prog.id); }}
                    class="text-red-600 hover:text-red-800 p-1"
                    title="Удалить"
                  >
                    🗑️
                  </button>
                  <span class="text-gray-400">{expandedId === prog.id ? '▼' : '▶'}</span>
                </div>
              </div>
              
              {/* Expanded Content */}
              {expandedId === prog.id && (
                <div class="p-4 space-y-4 border-t">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField
                      label="Название программы"
                      value={prog.name}
                      onChange={(v) => updateProgram(prog.id, { name: v })}
                      disabled={editingId !== prog.id}
                    />
                    <SelectField
                      label="Уровень"
                      value={prog.degree_level}
                      options={[
                        { value: 'Bachelor', label: 'Бакалавриат' },
                        { value: 'Master', label: 'Магистратура' },
                        { value: 'PhD', label: 'Докторантура (PhD)' },
                        { value: 'Diploma', label: 'Диплом' },
                      ]}
                      onChange={(v) => updateProgram(prog.id, { degree_level: v })}
                      disabled={editingId !== prog.id}
                    />
                    <InputField
                      label="Длительность (лет)"
                      type="number"
                      value={prog.duration_years.toString()}
                      onChange={(v) => updateProgram(prog.id, { duration_years: parseInt(v) || 4 })}
                      disabled={editingId !== prog.id}
                    />
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Язык обучения"
                      value={prog.language}
                      onChange={(v) => updateProgram(prog.id, { language: v })}
                      disabled={editingId !== prog.id}
                    />
                    <InputField
                      label="Дедлайн подачи"
                      value={prog.application_deadline || ''}
                      onChange={(v) => updateProgram(prog.id, { application_deadline: v })}
                      disabled={editingId !== prog.id}
                    />
                  </div>

                  <TextAreaField
                    label="Описание программы"
                    value={prog.description || ''}
                    onChange={(v) => updateProgram(prog.id, { description: v })}
                    disabled={editingId !== prog.id}
                    rows={2}
                  />

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextAreaField
                      label="Требования для поступления"
                      value={prog.admission_requirements || ''}
                      onChange={(v) => updateProgram(prog.id, { admission_requirements: v })}
                      disabled={editingId !== prog.id}
                      rows={2}
                    />
                    <TextAreaField
                      label="Языковые требования"
                      value={prog.language_requirements || ''}
                      onChange={(v) => updateProgram(prog.id, { language_requirements: v })}
                      disabled={editingId !== prog.id}
                      rows={2}
                    />
                  </div>

                  <TextAreaField
                    label="Карьерные перспективы"
                    value={prog.career_outcomes || ''}
                    onChange={(v) => updateProgram(prog.id, { career_outcomes: v })}
                    disabled={editingId !== prog.id}
                    rows={2}
                  />
                  
                  {editingId === prog.id && (
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      class="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      ✓ Готово
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

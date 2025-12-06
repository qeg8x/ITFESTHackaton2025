/**
 * Полный редактор университета со всеми полями
 */

import { useState, useEffect } from 'preact/hooks';
import { useAdmin, useAdminAPI } from './AdminContext.tsx';
import type { University } from '../../src/types/university.ts';

// Импорт вкладок
import BasicInfoTab from './editor/BasicInfoTab.tsx';
import ProgramsTab from './editor/ProgramsTab.tsx';
import AdmissionsTab from './editor/AdmissionsTab.tsx';
import TuitionTab from './editor/TuitionTab.tsx';
import CampusTab from './editor/CampusTab.tsx';
import InternationalTab from './editor/InternationalTab.tsx';
import ContactsTab from './editor/ContactsTab.tsx';
import RankingsTab from './editor/RankingsTab.tsx';
import JSONTab from './editor/JSONTab.tsx';

type Tab = 'basic' | 'programs' | 'admissions' | 'tuition' | 'campus' | 'international' | 'contacts' | 'rankings' | 'json';

interface Props {
  universityId: string;
}

/**
 * Главный компонент редактора университета
 */
export default function UniversityEditor({ universityId }: Props) {
  const { logout } = useAdmin();
  const { fetchWithAuth } = useAdminAPI();
  
  const [university, setUniversity] = useState<University | null>(null);
  const [originalData, setOriginalData] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasChanges = university ? JSON.stringify(university) !== originalData : false;

  useEffect(() => {
    loadUniversity();
  }, [universityId]);

  /**
   * Загрузить данные университета
   */
  const loadUniversity = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth(`/api/admin/universities/${universityId}/profile`);
      const data = await response.json();
      if (response.ok && data.profile) {
        setUniversity(data.profile);
        setOriginalData(JSON.stringify(data.profile));
      } else {
        setError(data.error || 'Не удалось загрузить');
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Запустить парсинг и обновление данных с сайта
   */
  const handleUpdateFromSource = async () => {
    setIsUpdating(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`/api/admin/update-now?university_id=${universityId}`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(`Обновлено! ${data.message || ''}`);
        // Перезагрузить данные
        await loadUniversity();
      } else {
        setError(data.message || data.error || 'Не удалось обновить');
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Обновить поле по пути (например 'contacts.phone')
   */
  const updateField = (path: string, value: unknown) => {
    if (!university) return;
    
    const updated = JSON.parse(JSON.stringify(university)); // Deep clone
    const parts = path.split('.');
    let current = updated;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (current[parts[i]] === undefined || current[parts[i]] === null) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
    setUniversity(updated);
  };

  /**
   * Сохранить изменения
   */
  const handleSave = async () => {
    if (!university) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`/api/admin/universities/${universityId}/profile`, {
        method: 'PUT',
        body: JSON.stringify({ university }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess('Сохранено успешно!');
        setOriginalData(JSON.stringify(university));
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || 'Не удалось сохранить');
      }
    } catch {
      setError('Ошибка соединения');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Отменить изменения
   */
  const handleCancel = () => {
    if (originalData) {
      setUniversity(JSON.parse(originalData));
    }
  };

  // Состояние загрузки
  if (isLoading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Университет не найден
  if (!university) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="text-center">
          <p class="text-red-600 text-lg">{error || 'Университет не найден'}</p>
          <a href="/admin" class="mt-4 text-blue-600 hover:underline inline-block">← Назад к списку</a>
        </div>
      </div>
    );
  }

  // Конфигурация вкладок
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'basic', label: 'Основное', icon: '📋' },
    { id: 'programs', label: 'Программы', icon: '🎓' },
    { id: 'admissions', label: 'Поступление', icon: '📝' },
    { id: 'tuition', label: 'Стоимость', icon: '💰' },
    { id: 'campus', label: 'Кампус', icon: '🏛️' },
    { id: 'international', label: 'Международное', icon: '🌍' },
    { id: 'contacts', label: 'Контакты', icon: '📞' },
    { id: 'rankings', label: 'Рейтинги', icon: '🏆' },
    { id: 'json', label: 'JSON', icon: '{ }' },
  ];

  return (
    <div class="min-h-screen bg-gray-100">
      {/* Header */}
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <a 
                href="/"
                class="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                🏠
              </a>
              <a href="/admin" class="text-blue-600 hover:text-blue-800">← Назад</a>
              <div>
                <h1 class="text-xl font-bold text-gray-900">{university.name}</h1>
                {university.name_en && (
                  <p class="text-sm text-gray-500">{university.name_en}</p>
                )}
              </div>
              {hasChanges && (
                <span class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                  Есть изменения
                </span>
              )}
            </div>
            <div class="flex items-center gap-3">
              <button
                type="button"
                onClick={handleUpdateFromSource}
                disabled={isUpdating}
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                title="Запустить парсинг и обновить данные с сайта"
              >
                {isUpdating ? (
                  <>
                    <span class="animate-spin">⏳</span>
                    Обновление...
                  </>
                ) : (
                  <>🔄 Обновить с сайта</>
                )}
              </button>
              <button
                type="button"
                onClick={logout}
                class="text-sm text-red-600 hover:text-red-800"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {error && (
          <div class="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)}>×</button>
          </div>
        )}
        {success && (
          <div class="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">{success}</div>
        )}
      </div>

      {/* Tabs */}
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div class="border-b border-gray-200 bg-white rounded-t-lg">
          <nav class="flex flex-wrap -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                class={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div class="bg-white rounded-b-lg shadow p-6">
          {activeTab === 'basic' && (
            <BasicInfoTab university={university} updateField={updateField} />
          )}
          {activeTab === 'programs' && (
            <ProgramsTab 
              programs={university.programs || []} 
              onUpdate={(p) => updateField('programs', p)} 
            />
          )}
          {activeTab === 'admissions' && (
            <AdmissionsTab 
              admissions={university.admissions || {}} 
              updateField={updateField} 
            />
          )}
          {activeTab === 'tuition' && (
            <TuitionTab 
              tuitionGeneral={university.tuition_general || {}}
              scholarships={university.scholarships || []}
              updateField={updateField}
            />
          )}
          {activeTab === 'campus' && (
            <CampusTab 
              campus={university.campus || {}} 
              other={university.other || {}}
              updateField={updateField} 
            />
          )}
          {activeTab === 'international' && (
            <InternationalTab 
              international={university.international || { accepts_international: false, languages_of_instruction: [] }} 
              updateField={updateField} 
            />
          )}
          {activeTab === 'contacts' && (
            <ContactsTab 
              contacts={university.contacts || {}} 
              updateField={updateField} 
            />
          )}
          {activeTab === 'rankings' && (
            <RankingsTab 
              rankings={university.rankings || []} 
              onUpdate={(r) => updateField('rankings', r)} 
            />
          )}
          {activeTab === 'json' && (
            <JSONTab data={university} onChange={setUniversity} />
          )}
        </div>

        {/* Actions */}
        <div class="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
            disabled={!hasChanges || isSaving}
            class="px-6 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Отменить
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? 'Сохранение...' : '💾 Сохранить'}
          </button>
        </div>
      </main>
    </div>
  );
}

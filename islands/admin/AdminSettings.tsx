/**
 * Страница настроек админ-панели
 */

import { useState } from 'preact/hooks';
import { useAdmin, useAdminAPI } from './AdminContext.tsx';

export default function AdminSettings() {
  const { adminInfo, logout } = useAdmin();
  const { fetchWithAuth } = useAdminAPI();

  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [workerEnabled, setWorkerEnabled] = useState(true);
  const [workerInterval, setWorkerInterval] = useState(24);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const testOllama = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetchWithAuth('/api/parser');
      const data = await response.json();
      if (data.ollama_available) {
        setTestResult('✓ Ollama доступна');
      } else {
        setTestResult('✗ Ollama недоступна');
      }
    } catch {
      setTestResult('✗ Ошибка соединения');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div class="min-h-screen bg-dark-900">
      {/* Header */}
      <header class="bg-dark-800 border-b border-dark-600">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <a href="/admin" class="text-cyber-400 hover:text-cyber-300">
                ← Назад
              </a>
              <h1 class="text-2xl font-bold text-white">⚙️ Настройки</h1>
            </div>
            <button
              type="button"
              onClick={logout}
              class="text-sm text-red-400 hover:text-red-300"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol class="flex items-center space-x-2 text-sm text-gray-500">
          <li><a href="/admin" class="hover:text-cyber-400">Админ</a></li>
          <li>/</li>
          <li class="text-white">Настройки</li>
        </ol>
      </nav>

      {/* Content */}
      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Admin Info */}
        <div class="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <h2 class="text-lg font-medium text-white mb-4">👤 Текущий админ</h2>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">Имя:</span>
              <span class="ml-2 font-medium text-white">{adminInfo?.name || 'Admin'}</span>
            </div>
            <div>
              <span class="text-gray-500">Email:</span>
              <span class="ml-2 text-gray-300">{adminInfo?.email || '—'}</span>
            </div>
            <div>
              <span class="text-gray-500">Права:</span>
              <span class="ml-2 text-gray-300">
                {adminInfo?.permissions?.join(', ') || 'full_access'}
              </span>
            </div>
          </div>
        </div>

        {/* Ollama Settings */}
        <div class="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <h2 class="text-lg font-medium text-white mb-4">🤖 Ollama AI</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300">URL сервера</label>
              <div class="mt-1 flex gap-2">
                <input
                  type="url"
                  value={ollamaUrl}
                  onInput={(e) => setOllamaUrl((e.target as HTMLInputElement).value)}
                  class="flex-1 p-2 bg-dark-700 border border-dark-600 text-white rounded placeholder-gray-500"
                  placeholder="http://localhost:11434"
                />
                <button
                  type="button"
                  onClick={testOllama}
                  disabled={isTesting}
                  class="px-4 py-2 bg-cyber-500 text-dark-900 font-medium rounded hover:bg-cyber-400 disabled:opacity-50"
                >
                  {isTesting ? '...' : 'Тест'}
                </button>
              </div>
              {testResult && (
                <p class={`mt-2 text-sm ${testResult.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>
                  {testResult}
                </p>
              )}
            </div>
            <p class="text-xs text-gray-500">
              Настраивается через переменную окружения OLLAMA_URL
            </p>
          </div>
        </div>

        {/* Worker Settings */}
        <div class="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <h2 class="text-lg font-medium text-white mb-4">🔄 Автообновление</h2>
          <div class="space-y-4">
            <div class="flex items-center">
              <input
                id="worker-enabled"
                type="checkbox"
                checked={workerEnabled}
                onChange={(e) => setWorkerEnabled((e.target as HTMLInputElement).checked)}
                class="h-4 w-4 text-cyber-500 rounded bg-dark-700 border-dark-600"
              />
              <label for="worker-enabled" class="ml-2 text-sm text-gray-300">
                Включить фоновое обновление
              </label>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300">
                Интервал обновления (часы)
              </label>
              <input
                type="number"
                value={workerInterval}
                onInput={(e) => setWorkerInterval(parseInt((e.target as HTMLInputElement).value))}
                min={1}
                max={168}
                class="mt-1 w-32 p-2 bg-dark-700 border border-dark-600 text-white rounded"
              />
            </div>
            <p class="text-xs text-gray-500">
              Настраивается через переменные UPDATE_WORKER_ENABLED и UPDATE_INTERVAL_HOURS
            </p>
          </div>
        </div>

        {/* Database Info */}
        <div class="bg-dark-800 rounded-lg border border-dark-600 p-6">
          <h2 class="text-lg font-medium text-white mb-4">🗄️ База данных</h2>
          <div class="text-sm text-gray-400">
            <p>PostgreSQL подключение настраивается через DATABASE_URL</p>
            <p class="mt-2 text-xs text-gray-500">
              Пример: postgresql://user:pass@localhost:5432/digital_university
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div class="bg-dark-800 rounded-lg border-2 border-red-500/30 p-6">
          <h2 class="text-lg font-medium mb-4 text-red-400">⚠️ Опасная зона</h2>
          <div class="space-y-4">
            <div class="flex justify-between items-center">
              <div>
                <p class="font-medium text-white">Очистить кэш парсера</p>
                <p class="text-sm text-gray-500">Удалит все закэшированные промпты</p>
              </div>
              <button
                type="button"
                class="px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                onClick={() => alert('Функция в разработке')}
              >
                Очистить
              </button>
            </div>
            <div class="flex justify-between items-center">
              <div>
                <p class="font-medium text-white">Пересканировать все сайты</p>
                <p class="text-sm text-gray-500">Запустит парсинг всех университетов</p>
              </div>
              <button
                type="button"
                class="px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                onClick={() => alert('Функция в разработке')}
              >
                Запустить
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

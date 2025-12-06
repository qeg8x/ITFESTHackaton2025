/**
 * Обёртка для админ компонентов с проверкой аутентификации
 * Это единственный island для админки - он полностью клиентский
 */

import { useAdmin, AdminProvider } from './AdminContext.tsx';
import AdminLogin from './AdminLogin.tsx';
import AdminDashboard from './AdminDashboard.tsx';

type PageType = 'dashboard' | 'logs' | 'settings' | 'editor';

interface Props {
  page?: PageType;
  universityId?: string;
}

/**
 * Внутренний компонент с проверкой аутентификации
 */
function AuthGate({ page, universityId }: Props) {
  const { isAuthenticated, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-dark-900">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  // Динамический импорт страниц - все они уже используют useAdmin
  switch (page) {
    case 'logs':
      // Lazy import для логов
      return <LazyAdminLogs />;
    case 'settings':
      return <LazyAdminSettings />;
    case 'editor':
      return <LazyUniversityEditor universityId={universityId || ''} />;
    default:
      return <AdminDashboard />;
  }
}

/**
 * Ленивые компоненты для уменьшения бандла
 */
import AdminLogs from './AdminLogs.tsx';
import AdminSettings from './AdminSettings.tsx';
import UniversityEditor from './UniversityEditor.tsx';

function LazyAdminLogs() {
  return <AdminLogs />;
}

function LazyAdminSettings() {
  return <AdminSettings />;
}

function LazyUniversityEditor({ universityId }: { universityId: string }) {
  return <UniversityEditor universityId={universityId} />;
}

/**
 * Главный компонент-обёртка админки
 */
export default function AdminWrapper({ page = 'dashboard', universityId }: Props) {
  return (
    <AdminProvider>
      <AuthGate page={page} universityId={universityId} />
    </AdminProvider>
  );
}

/**
 * Страница настроек админ-панели
 */

import { Head } from '$fresh/runtime.ts';
import AdminWrapper from '../../islands/admin/AdminWrapper.tsx';

export default function SettingsPage() {
  return (
    <>
      <Head>
        <title>Настройки | Админ-панель</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminWrapper page="settings" />
    </>
  );
}

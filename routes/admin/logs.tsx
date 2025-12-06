/**
 * Страница логов админ-действий
 */

import { Head } from '$fresh/runtime.ts';
import AdminWrapper from '../../islands/admin/AdminWrapper.tsx';

export default function LogsPage() {
  return (
    <>
      <Head>
        <title>Логи | Админ-панель</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminWrapper page="logs" />
    </>
  );
}

/**
 * Страница редактирования университета
 */

import { Head } from '$fresh/runtime.ts';
import { Handlers, PageProps } from '$fresh/server.ts';
import AdminWrapper from '../../../islands/admin/AdminWrapper.tsx';

interface Data {
  id: string;
}

export const handler: Handlers<Data> = {
  GET(_req, ctx) {
    return ctx.render({ id: ctx.params.id });
  },
};

export default function EditUniversityPage({ data }: PageProps<Data>) {
  return (
    <>
      <Head>
        <title>Редактирование | Админ-панель</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminWrapper page="editor" universityId={data.id} />
    </>
  );
}

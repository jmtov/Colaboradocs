import { AccessPanel } from '@colaboradocs/review-ui';
import { Show } from 'solid-js';
import PageBar from '@/PageBar/PageBar';
import type { AdminPageName } from '@/router/router';
import { ADMIN_TITLES } from './AdminPage.constants';
import { useAdminPage } from './AdminPage.hooks';
import styles from './AdminPage.module.css';

type Props = {
  /** Nombre del espacio, en el encabezado. */
  name: string;
  page: AdminPageName;
};

/** Página de administración (solo admins): el encabezado de siempre y, debajo, los accesos. */
export default function AdminPage(props: Props) {
  const admin = useAdminPage();

  return (
    <>
      <PageBar backLabel="Inicio" backHref="/" name={props.name}>
        <Show when={admin.offline()}>
          <span role="status">Sin conexión</span>
        </Show>
      </PageBar>
      <main class={styles.page}>
        <Show
          when={admin.isAdmin()}
          fallback={
            <section class={styles.intro}>
              <h1 class={styles.title}>Solo para administradores</h1>
            </section>
          }
        >
          <section class={styles.intro}>
            <span class={styles.eyebrow}>Administración</span>
            <h1 class={styles.title}>{ADMIN_TITLES[props.page]}</h1>
          </section>
          <div class={styles.content}>
            <AccessPanel />
          </div>
        </Show>
      </main>
    </>
  );
}

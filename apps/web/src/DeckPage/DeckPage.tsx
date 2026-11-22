import { Button, useReview } from '@colaboradocs/review-ui';
import { Match, Show, Switch } from 'solid-js';
import PencilIcon from '@/icons/PencilIcon';
import RefreshIcon from '@/icons/RefreshIcon';
import Loading from '@/Loading/Loading';
import PageBar from '@/PageBar/PageBar';
import { deckEditPath, navigate } from '@/router/router';
import { useDeckPage } from './DeckPage.hooks';
import styles from './DeckPage.module.css';

type Props = { id: string; name: string };

/** Una presentación: se dibuja en un iframe aislado (solo scripts, sin acceso a la sesión). */
export default function DeckPage(props: Props) {
  const page = useDeckPage(() => props.id);
  const review = useReview();
  const isAdmin = () => review.session()?.reviewer.isAdmin === true;

  return (
    <Switch>
      <Match when={page.deck.error && page.notFound()}>
        <Loading>
          <h1>No encontramos esa presentación</h1>
        </Loading>
      </Match>
      <Match when={page.deck.error}>
        <Loading>
          <h1>No se pudo cargar la presentación</h1>
          <p>
            <Button icon={RefreshIcon} onClick={() => void page.refetch()}>
              Reintentar
            </Button>
          </p>
        </Loading>
      </Match>
      <Match when={page.deck()} keyed>
        {(deck) => (
          <div class={styles.page}>
            <PageBar backLabel="Inicio" backHref="/" name={props.name}>
              <Show when={isAdmin()}>
                <Button
                  icon={PencilIcon}
                  size="sm"
                  onClick={() => navigate(deckEditPath(props.id))}
                >
                  Editar
                </Button>
              </Show>
            </PageBar>
            <iframe
              class={styles.frame}
              title={deck.title}
              sandbox="allow-scripts"
              allow="fullscreen"
              srcdoc={deck.html}
            />
          </div>
        )}
      </Match>
      <Match when={page.deck.loading}>
        <Loading>Cargando…</Loading>
      </Match>
    </Switch>
  );
}

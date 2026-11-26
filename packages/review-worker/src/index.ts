import { Hono } from 'hono';
import { requireAdminAccess, requireReviewer } from './access/auth.middleware';
import { loginRoute } from './access/login.route';
import { reviewersRoute } from './access/reviewers.route';
import { decksRoute } from './deck/deck.route';
import { documentAdminRoute } from './document/admin.route';
import { requireDocumentId } from './document/document.middleware';
import { documentRoute } from './document/document.route';
import { reviewRoute } from './review/review.route';
import type { AppEnv } from './shared/env.types';
import { spaceRoute } from './space/space.route';
import { tasksRoute } from './task/task.route';
import { utcpRoute } from './utcp/utcp.route';

const app = new Hono<AppEnv>().basePath('/api');

// El guard de todo `/admin/*` va aquí, antes de montar cualquier ruta: así una ruta nueva en
// cualquier carpeta queda protegida sin acordarse de declararlo (niega por omisión).
app.use('/admin/*', requireReviewer, requireAdminAccess);
// Lo mismo para lo que cuelga de un documento: sesión y un id con forma válida.
app.use('/documents/:documentId/*', requireReviewer, requireDocumentId);

app.route('/', loginRoute);
app.route('/', documentRoute);
app.route('/', reviewRoute);
app.route('/', reviewersRoute);
app.route('/', documentAdminRoute);
app.route('/', spaceRoute);
app.route('/', decksRoute);
app.route('/', tasksRoute);
app.route('/', utcpRoute);
app.notFound((c) => c.json({ error: 'not_found' }, 404));

export default app;

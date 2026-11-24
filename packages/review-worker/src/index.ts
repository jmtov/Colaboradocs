import { Hono } from 'hono';
import type { AppEnv } from './env.types';
import { adminRoute } from './routes/admin.route';
import { decksRoute } from './routes/decks.route';
import { loginRoute } from './routes/login.route';
import { reviewRoute } from './routes/review.route';
import { spaceRoute } from './routes/space.route';
import { tasksRoute } from './routes/tasks.route';
import { utcpRoute } from './routes/utcp.route';

const app = new Hono<AppEnv>().basePath('/api');

app.route('/', loginRoute);
app.route('/', reviewRoute);
app.route('/', adminRoute);
app.route('/', spaceRoute);
app.route('/', decksRoute);
app.route('/', tasksRoute);
app.route('/', utcpRoute);
app.notFound((c) => c.json({ error: 'not_found' }, 404));

export default app;

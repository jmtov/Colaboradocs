import { Hono } from 'hono';
import type { AppEnv } from './env.types';
import { adminRoute } from './routes/admin.route';
import { loginRoute } from './routes/login.route';
import { reviewRoute } from './routes/review.route';
import { spaceRoute } from './routes/space.route';

const app = new Hono<AppEnv>().basePath('/api');

app.route('/', loginRoute);
app.route('/', reviewRoute);
app.route('/', adminRoute);
app.route('/', spaceRoute);
app.notFound((c) => c.json({ error: 'not_found' }, 404));

export default app;

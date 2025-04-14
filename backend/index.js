import { Router } from 'itty-router';
import { handleOptions, corsHeaders } from './utils/cors';
import { registerAuthRoutes } from './routes/auth';
import { registerPostRoutes } from './routes/posts';
import { registerCommentRoutes } from './routes/comments';
import { registerProfileRoutes } from './routes/profile';
import { registerMediaRoutes } from './routes/media';
import { registerDataRoutes } from './routes/data';

const router = Router();

// CORS preflight
router.options('*', handleOptions);

// Register routes
registerAuthRoutes(router);
registerPostRoutes(router);
registerCommentRoutes(router);
registerProfileRoutes(router);
registerMediaRoutes(router);
registerDataRoutes(router);

// Fallback
router.all('*', () => new Response('Not Found', { status: 404, headers: corsHeaders }));

export default {
  fetch: router.handle,
};

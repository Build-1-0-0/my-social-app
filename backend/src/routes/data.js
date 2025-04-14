import { verifyToken } from '../utils/auth';
import { corsHeaders } from '../utils/cors';

export function registerDataRoutes(router) {
  router.get('/api/data', async ({ request, env }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    try {
      const userId = await verifyToken(token, env.JWT_SECRET);
      const users = await env.DB.prepare('SELECT username, email, bio FROM users ORDER BY username ASC').all();

      return new Response(JSON.stringify(users.results), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Get users error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch users: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });
}

import { corsHeaders } from '../utils/cors';
import { authenticate } from '../utils/auth';

export async function getData(request, env) {
  try {
    authenticate(request, env); // Require auth
    const { results } = await env.social_app_db
      .prepare('SELECT id, username, created_at FROM users')
      .all();
    return new Response(JSON.stringify({ users: results || [], count: results?.length || 0 }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Get data error:', err);
    return err.response || new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
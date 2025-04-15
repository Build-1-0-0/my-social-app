import { corsHeaders } from '../utils/cors';
import { authenticate } from '../utils/auth';

export async function getProfile(request, env) {
  try {
    const url = new URL(request.url);
    const username = url.searchParams.get('username');
    if (!username) {
      return new Response(JSON.stringify({ error: 'Username required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const user = await env.social_app_db
      .prepare('SELECT username, email, created_at FROM users WHERE username = ?')
      .bind(username)
      .first();
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    return new Response(JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function updateProfile(request, env) {
  try {
    const payload = authenticate(request, env);
    const url = new URL(request.url);
    const username = url.searchParams.get('username');
    if (!username) {
      return new Response(JSON.stringify({ error: 'Username required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    const { email } = await request.json();

    const user = await env.social_app_db
      .prepare('SELECT id, email FROM users WHERE username = ?')
      .bind(username)
      .first();
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    if (user.id !== payload.userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    await env.social_app_db
      .prepare('UPDATE users SET email = ? WHERE username = ?')
      .bind(email || user.email, username)
      .run();

    return new Response(JSON.stringify({ username, email: email || user.email }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return err.response || new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
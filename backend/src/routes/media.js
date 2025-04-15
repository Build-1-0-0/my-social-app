import { corsHeaders } from '../utils/cors';
import { authenticate } from '../utils/auth';

export async function getMedia(request, env) {
  try {
    const url = new URL(request.url);
    const username = url.searchParams.get('username');
    if (!username) {
      return new Response(JSON.stringify({ error: 'Username required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { results } = await env.social_app_db
      .prepare('SELECT id, url, created_at FROM media WHERE username = ?')
      .bind(username)
      .all();
    return new Response(JSON.stringify({ media: results || [], count: results?.length || 0 }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Get media error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function uploadMedia(request, env) {
  try {
    const payload = authenticate(request, env);
    const { url } = await request.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const mediaId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await env.social_app_db
      .prepare('INSERT INTO media (id, user_id, username, url, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(mediaId, payload.userId, payload.username, url, createdAt)
      .run();

    return new Response(
      JSON.stringify({ id: mediaId, user_id: payload.userId, username: payload.username, url, created_at: createdAt }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('Upload media error:', err);
    return err.response || new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
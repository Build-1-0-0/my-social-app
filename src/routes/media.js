import { verifyToken } from '../utils/auth';
import { uploadToB2 } from '../utils/b2';
import { corsHeaders } from '../utils/cors';

export function registerMediaRoutes(router) {
  router.post('/api/upload', async ({ request, env }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    try {
      const userId = await verifyToken(token, env.JWT_SECRET);
      const user = await env.DB.prepare('SELECT username FROM users WHERE id = ?').bind(userId).first();
      if (!user) {
        return new Response('User not found', { status: 404, headers: corsHeaders });
      }

      const formData = await request.formData();
      const file = formData.get('file');
      if (!file) {
        return new Response(JSON.stringify({ error: 'File is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const mimeType = file.type;
      const { fileId, url } = await uploadToB2(file, mimeType, env, user.username);

      const mediaId = crypto.randomUUID();
      await env.DB.prepare(
        'INSERT INTO media (media_id, username, file_id, url, mime_type, uploaded_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
        .bind(mediaId, user.username, fileId, url, mimeType, new Date().toISOString())
        .run();

      return new Response(JSON.stringify({ mediaId, url, mimeType }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Upload error:', error);
      return new Response(JSON.stringify({ error: 'Failed to upload media: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });

  router.get('/api/media/:id', async ({ request, env }) => {
    try {
      const mediaId = request.params.id;
      const media = await env.DB.prepare(
        'SELECT media_id, username, url, mime_type, uploaded_at FROM media WHERE media_id = ?'
      )
        .bind(mediaId)
        .first();

      if (!media) {
        return new Response('Media not found', { status: 404, headers: corsHeaders });
      }

      return new Response(JSON.stringify(media), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Get media error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch media: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });

  router.get('/api/media/:username', async ({ request, env }) => {
    try {
      const { username } = request.params;
      const media = await env.DB.prepare(
        'SELECT media_id, username, url, mime_type, uploaded_at FROM media WHERE username = ? ORDER BY uploaded_at DESC'
      )
        .bind(username)
        .all();

      return new Response(JSON.stringify(media.results), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Get user media error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch user media: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });
}

import { verifyToken } from '../utils/auth';
import { corsHeaders } from '../utils/cors';

export function registerProfileRoutes(router) {
  router.get('/api/profile/:username', async ({ request, env }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    try {
      const userId = await verifyToken(token, env.JWT_SECRET);
      const { username } = request.params;

      const profile = await env.DB.prepare(
        'SELECT username, email, bio, profilePictureUrl FROM users WHERE username = ?'
      )
        .bind(username)
        .first();
      if (!profile) {
        return new Response('Profile not found', { status: 404, headers: corsHeaders });
      }

      return new Response(JSON.stringify(profile), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch profile: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });

  router.put('/api/profile/:username', async ({ request, env }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    try {
      const userId = await verifyToken(token, env.JWT_SECRET);
      const { username } = request.params;
      const { bio, profilePictureId } = await request.json();

      const user = await env.DB.prepare('SELECT id, username FROM users WHERE username = ?').bind(username).first();
      if (!user || user.id !== userId) {
        return new Response('Forbidden', { status: 403, headers: corsHeaders });
      }

      if (bio !== undefined && (typeof bio !== 'string' || bio.length > 500)) {
        return new Response(JSON.stringify({ error: 'Bio must be a string under 500 characters' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (profilePictureId && typeof profilePictureId !== 'string') {
        return new Response(JSON.stringify({ error: 'Invalid profile picture ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      if (profilePictureId) {
        const media = await env.DB.prepare('SELECT username FROM media WHERE media_id = ?')
          .bind(profilePictureId)
          .first();
        if (!media || media.username !== username) {
          return new Response(JSON.stringify({ error: 'Invalid media ID' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }

      const updates = [];
      const bindings = [];
      if (bio !== undefined) {
        updates.push('bio = ?');
        bindings.push(bio);
      }
      if (profilePictureId) {
        updates.push('profilePictureUrl = ?');
        bindings.push(profilePictureId);
      }

      if (updates.length === 0) {
        return new Response(JSON.stringify({ error: 'No valid fields to update' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      bindings.push(username);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE username = ? RETURNING username, email, bio, profilePictureUrl`;
      const updatedProfile = await env.DB.prepare(query).bind(...bindings).first();

      return new Response(JSON.stringify(updatedProfile), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return new Response(JSON.stringify({ error: 'Failed to update profile: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });
                                    }

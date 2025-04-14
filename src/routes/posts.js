import { verifyToken } from '../utils/auth';
import { corsHeaders } from '../utils/cors';

export function registerPostRoutes(router) {
  router.get('/api/posts', async ({ request, env }) => {
    try {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      let userId = null;
      if (token) {
        try {
          userId = await verifyToken(token, env.JWT_SECRET);
        } catch (error) {
          // Allow unauthenticated access
        }
      }

      const posts = await env.DB.prepare(
        'SELECT id, username, content, media_id, created_at, likes FROM posts ORDER BY created_at DESC LIMIT 50'
      ).all();
      return new Response(JSON.stringify(posts.results), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Get posts error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch posts: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });

  router.post('/api/posts', async ({ request, env }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    try {
      const userId = await verifyToken(token, env.JWT_SECRET);
      const { content, mediaId } = await request.json();
      if (!content || typeof content !== 'string' || content.length > 1000) {
        return new Response(JSON.stringify({ error: 'Content is required and must be a string under 1000 characters' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const user = await env.DB.prepare('SELECT username FROM users WHERE id = ?').bind(userId).first();
      if (!user) {
        return new Response('User not found', { status: 404, headers: corsHeaders });
      }

      if (mediaId) {
        const media = await env.DB.prepare('SELECT username FROM media WHERE media_id = ?').bind(mediaId).first();
        if (!media || media.username !== user.username) {
          return new Response(JSON.stringify({ error: 'Invalid media ID' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }

      const result = await env.DB.prepare(
        'INSERT INTO posts (username, content, media_id, created_at) VALUES (?, ?, ?, ?) RETURNING *'
      )
        .bind(user.username, content, mediaId || null, new Date().toISOString())
        .first();

      return new Response(JSON.stringify(result), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Create post error:', error);
      return new Response(JSON.stringify({ error: 'Failed to create post: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });

  router.post('/api/posts/:id/like', async ({ request, env }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    try {
      const userId = await verifyToken(token, env.JWT_SECRET);
      const postId = request.params.id;

      const post = await env.DB.prepare('SELECT likes FROM posts WHERE id = ?').bind(postId).first();
      if (!post) {
        return new Response('Post not found', { status: 404, headers: corsHeaders });
      }

      await env.DB.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').bind(postId).run();

      return new Response(JSON.stringify({ likes: (post.likes || 0) + 1 }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Like post error:', error);
      return new Response(JSON.stringify({ error: 'Failed to like post: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });

  router.put('/api/posts/:id', async ({ request, env }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    try {
      const userId = await verifyToken(token, env.JWT_SECRET);
      const postId = request.params.id;
      const { content, mediaId } = await request.json();

      if (!content || typeof content !== 'string' || content.length > 1000) {
        return new Response(JSON.stringify({ error: 'Content is required and must be a string under 1000 characters' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const user = await env.DB.prepare('SELECT username FROM users WHERE id = ?').bind(userId).first();
      if (!user) {
        return new Response('User not found', { status: 404, headers: corsHeaders });
      }

      const post = await env.DB.prepare('SELECT username FROM posts WHERE id = ?').bind(postId).first();
      if (!post || post.username !== user.username) {
        return new Response('Forbidden', { status: 403, headers: corsHeaders });
      }

      if (mediaId) {
        const media = await env.DB.prepare('SELECT username FROM media WHERE media_id = ?').bind(mediaId).first();
        if (!media || media.username !== user.username) {
          return new Response(JSON.stringify({ error: 'Invalid media ID' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      }

      const updatedPost = await env.DB.prepare('UPDATE posts SET content = ?, media_id = ? WHERE id = ? RETURNING *')
        .bind(content, mediaId || null, postId)
        .first();

      return new Response(JSON.stringify(updatedPost), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Edit post error:', error);
      return new Response(JSON.stringify({ error: 'Failed to edit post: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });

  router.delete('/api/posts/:id', async ({ request, env }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    try {
      const userId = await verifyToken(token, env.JWT_SECRET);
      const postId = request.params.id;

      const user = await env.DB.prepare('SELECT username FROM users WHERE id = ?').bind(userId).first();
      if (!user) {
        return new Response('User not found', { status: 404, headers: corsHeaders });
      }

      const post = await env.DB.prepare('SELECT username FROM posts WHERE id = ?').bind(postId).first();
      if (!post || post.username !== user.username) {
        return new Response('Forbidden', { status: 403, headers: corsHeaders });
      }

      await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run();

      return new Response(null, { status: 204, headers: corsHeaders });
    } catch (error) {
      console.error('Delete post error:', error);
      return new Response(JSON.stringify({ error: 'Failed to delete post: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });
}}

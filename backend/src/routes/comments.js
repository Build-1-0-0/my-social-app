import { verifyToken } from '../utils/auth';
import { corsHeaders } from '../utils/cors';

export function registerCommentRoutes(router) {
  router.get('/api/comments', async ({ request, env }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    try {
      const userId = await verifyToken(token, env.JWT_SECRET);
      const postId = request.query.postId;
      if (!postId) {
        return new Response(JSON.stringify({ error: 'Post ID is required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const comments = await env.DB.prepare(
        'SELECT id, postId, username, content, timestamp, likes FROM comments WHERE postId = ? ORDER BY timestamp ASC'
      )
        .bind(postId)
        .all();

      return new Response(JSON.stringify(comments.results), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Get comments error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch comments: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });

  router.post('/api/comments', async ({ request, env }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    try {
      const userId = await verifyToken(token, env.JWT_SECRET);
      const { postId, content } = await request.json();
      if (!postId || !content || typeof content !== 'string' || content.length > 500) {
        return new Response(JSON.stringify({ error: 'Post ID and content are required, content must be under 500 characters' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const user = await env.DB.prepare('SELECT username FROM users WHERE id = ?').bind(userId).first();
      if (!user) {
        return new Response('User not found', { status: 404, headers: corsHeaders });
      }

      const post = await env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(postId).first();
      if (!post) {
        return new Response('Post not found', { status: 404, headers: corsHeaders });
      }

      const comment = await env.DB.prepare(
        'INSERT INTO comments (postId, username, content, timestamp) VALUES (?, ?, ?, ?) RETURNING *'
      )
        .bind(postId, user.username, content, new Date().toISOString())
        .first();

      return new Response(JSON.stringify(comment), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Create comment error:', error);
      return new Response(JSON.stringify({ error: 'Failed to create comment: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });

  router.post('/api/comments/:id/like', async ({ request, env }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

    try {
      const userId = await verifyToken(token, env.JWT_SECRET);
      const commentId = request.params.id;

      const comment = await env.DB.prepare('SELECT likes FROM comments WHERE id = ?').bind(commentId).first();
      if (!comment) {
        return new Response('Comment not found', { status: 404, headers: corsHeaders });
      }

      await env.DB.prepare('UPDATE comments SET likes = likes + 1 WHERE id = ?').bind(commentId).run();

      return new Response(JSON.stringify({ likes: (comment.likes || 0) + 1 }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Like comment error:', error);
      return new Response(JSON.stringify({ error: 'Failed to like comment: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });
                                       }

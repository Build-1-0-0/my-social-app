import { corsHeaders } from '../utils/cors';
import { authenticate } from '../utils/auth';

export async function createComment(request, env) {
  try {
    const payload = authenticate(request, env);
    const { postId, content } = await request.json();
    if (!postId || !content?.trim()) {
      return new Response(JSON.stringify({ error: 'Post ID and content required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const post = await env.social_app_db
      .prepare('SELECT id FROM posts WHERE id = ?')
      .bind(postId)
      .first();
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const commentId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await env.social_app_db
      .prepare(
        'INSERT INTO comments (id, post_id, user_id, username, content, created_at, likes) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(commentId, postId, payload.userId, payload.username, content, createdAt, 0)
      .run();

    return new Response(
      JSON.stringify({
        id: commentId,
        post_id: postId,
        user_id: payload.userId,
        username: payload.username,
        content,
        created_at: createdAt,
        likes: 0,
      }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('Create comment error:', err);
    return err.response || new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function getComments(request, env) {
  try {
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { results } = await env.social_app_db
      .prepare(
        'SELECT id, post_id, user_id, username, content, created_at, likes FROM comments WHERE post_id = ? ORDER BY created_at DESC'
      )
      .bind(postId)
      .all();
    return new Response(JSON.stringify({ comments: results || [], count: results?.length || 0 }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Get comments error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function likeComment(request, env) {
  try {
    const payload = authenticate(request, env);
    const url = new URL(request.url);
    const commentId = url.searchParams.get('id');
    if (!commentId) {
      return new Response(JSON.stringify({ error: 'Comment ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const comment = await env.social_app_db
      .prepare('SELECT id, likes FROM comments WHERE id = ?')
      .bind(commentId)
      .first();
    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Note: Like tracking for comments not implemented (future feature).
    const newLikes = (comment.likes || 0) + 1;
    await env.social_app_db
      .prepare('UPDATE comments SET likes = ? WHERE id = ?')
      .bind(newLikes, commentId)
      .run();

    return new Response(JSON.stringify({ id: commentId, likes: newLikes }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Like comment error:', err);
    return err.response || new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
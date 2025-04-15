import { corsHeaders } from '../utils/cors';
import { authenticate } from '../utils/auth';

export async function getPosts(request, env) {
  try {
    const { results } = await env.social_app_db
      .prepare('SELECT id, user_id, username, content, created_at, likes FROM posts ORDER BY created_at DESC')
      .all();
    return new Response(JSON.stringify({ posts: results || [], count: results?.length || 0 }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Get posts error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function createPost(request, env) {
  try {
    const payload = authenticate(request, env);
    const { content } = await request.json();
    if (!content?.trim()) {
      return new Response(JSON.stringify({ error: 'Content required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const postId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await env.social_app_db
      .prepare(
        'INSERT INTO posts (id, user_id, username, content, created_at, likes) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(postId, payload.userId, payload.username, content, createdAt, 0)
      .run();

    return new Response(
      JSON.stringify({ id: postId, user_id: payload.userId, username: payload.username, content, created_at: createdAt, likes: 0 }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('Create post error:', err);
    return err.response || new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function likePost(request, env) {
  try {
    const payload = authenticate(request, env);
    const url = new URL(request.url);
    const postId = url.searchParams.get('id');
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
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

    const existingLike = await env.social_app_db
      .prepare('SELECT 1 FROM post_likes WHERE user_id = ? AND post_id = ?')
      .bind(payload.userId, postId)
      .first();
    if (existingLike) {
      return new Response(JSON.stringify({ error: 'Post already liked' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const createdAt = new Date().toISOString();
    await env.social_app_db
      .prepare('INSERT INTO post_likes (user_id, post_id, created_at) VALUES (?, ?, ?)')
      .bind(payload.userId, postId, createdAt)
      .run();

    await env.social_app_db
      .prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?')
      .bind(postId)
      .run();

    const updatedPost = await env.social_app_db
      .prepare('SELECT likes FROM posts WHERE id = ?')
      .bind(postId)
      .first();

    return new Response(JSON.stringify({ id: postId, likes: updatedPost.likes }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Like post error:', err);
    return err.response || new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function updatePost(request, env) {
  try {
    const payload = authenticate(request, env);
    const url = new URL(request.url);
    const postId = url.searchParams.get('id');
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    const { content } = await request.json();
    if (!content?.trim()) {
      return new Response(JSON.stringify({ error: 'Content required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const post = await env.social_app_db
      .prepare('SELECT user_id FROM posts WHERE id = ?')
      .bind(postId)
      .first();
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    if (post.user_id !== payload.userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    await env.social_app_db
      .prepare('UPDATE posts SET content = ? WHERE id = ?')
      .bind(content, postId)
      .run();

    return new Response(
      JSON.stringify({ id: postId, user_id: payload.userId, username: payload.username, content }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('Update post error:', err);
    return err.response || new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function deletePost(request, env) {
  try {
    const payload = authenticate(request, env);
    const url = new URL(request.url);
    const postId = url.searchParams.get('id');
    if (!postId) {
      return new Response(JSON.stringify({ error: 'Post ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const post = await env.social_app_db
      .prepare('SELECT user_id FROM posts WHERE id = ?')
      .bind(postId)
      .first();
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    if (post.user_id !== payload.userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    await env.social_app_db
      .prepare('DELETE FROM posts WHERE id = ?')
      .bind(postId)
      .run();
    await env.social_app_db
      .prepare('DELETE FROM post_likes WHERE post_id = ?')
      .bind(postId)
      .run();

    return new Response(null, {
      status: 204,
      headers: { ...corsHeaders },
    });
  } catch (err) {
    console.error('Delete post error:', err);
    return err.response || new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
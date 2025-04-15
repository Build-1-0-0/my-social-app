import { corsHeaders } from '../utils/cors';
import { authenticate } from '../utils/auth';

export async function createComment(request, env) {
  try {
    const userData = authenticate(request, env);
    const { postId, content, parentId = null } = await request.json();
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

    if (parentId) {
      const parent = await env.social_app_db
        .prepare('SELECT id FROM comments WHERE id = ? AND post_id = ?')
        .bind(parentId, postId)
        .first();
      if (!parent) {
        return new Response(JSON.stringify({ error: 'Parent comment not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    const commentId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await env.social_app_db
      .prepare(
        'INSERT INTO comments (id, post_id, user_id, username, content, parent_id, created_at, likes) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(commentId, postId, userData.userId, userData.username, content, parentId, createdAt, 0)
      .run();

    return new Response(
      JSON.stringify({
        id: commentId,
        post_id: postId,
        user_id: userData.userId,
        username: userData.username,
        content,
        parent_id: parentId,
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
        'SELECT comments.id, comments.post_id, comments.user_id, comments.username, ' +
        'comments.content, comments.parent_id, comments.created_at, comments.likes ' +
        'FROM comments WHERE comments.post_id = ? ORDER BY comments.created_at ASC'
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

export async function editComment(request, env) {
  try {
    const userData = authenticate(request, env);
    const url = new URL(request.url);
    const commentId = url.searchParams.get('id');
    if (!commentId) {
      return new Response(JSON.stringify({ error: 'Comment ID required' }), {
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

    const comment = await env.social_app_db
      .prepare('SELECT user_id, post_id FROM comments WHERE id = ?')
      .bind(commentId)
      .first();
    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    if (comment.user_id !== userData.userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    await env.social_app_db
      .prepare('UPDATE comments SET content = ? WHERE id = ?')
      .bind(content, commentId)
      .run();

    return new Response(
      JSON.stringify({
        id: commentId,
        post_id: comment.post_id,
        user_id: userData.userId,
        username: userData.username,
        content,
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (err) {
    console.error('Edit comment error:', err);
    return err.response || new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function deleteComment(request, env) {
  try {
    const userData = authenticate(request, env);
    const url = new URL(request.url);
    const commentId = url.searchParams.get('id');
    if (!commentId) {
      return new Response(JSON.stringify({ error: 'Comment ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const comment = await env.social_app_db
      .prepare('SELECT user_id FROM comments WHERE id = ?')
      .bind(commentId)
      .first();
    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    if (comment.user_id !== userData.userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    await env.social_app_db
      .prepare('DELETE FROM comments WHERE id = ?')
      .bind(commentId)
      .run();

    return new Response(null, {
      status: 204,
      headers: { ...corsHeaders },
    });
  } catch (err) {
    console.error('Delete comment error:', err);
    return err.response || new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function likeComment(request, env) {
  try {
    const userData = authenticate(request, env);
    const url = new URL(request.url);
    const commentId = url.searchParams.get('id');
    if (!commentId) {
      return new Response(JSON.stringify({ error: 'Comment ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const comment = await env.social_app_db
      .prepare('SELECT id FROM comments WHERE id = ?')
      .bind(commentId)
      .first();
    if (!comment) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const newLikes = await env.social_app_db
      .prepare('UPDATE comments SET likes = likes + 1 WHERE id = ? RETURNING likes')
      .bind(commentId)
      .first();

    return new Response(JSON.stringify({ id: commentId, likes: newLikes.likes }), {
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
import { Router } from 'itty-router';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Initialize router
const router = Router();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://my-social-app.pages.dev',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle CORS preflight (OPTIONS)
router.options('*', () => new Response(null, { headers: corsHeaders }));

// JWT verification
async function verifyToken(token, secret) {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded.userId;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Hash password
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Compare password
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Get B2 authorization
async function getB2Auth(env) {
  const authResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: {
      'Authorization': 'Basic ' + btoa(`${env.B2_KEY_ID}:${env.B2_APPLICATION_KEY}`),
    },
  });
  if (!authResponse.ok) {
    throw new Error('Failed to authorize B2');
  }
  const authData = await authResponse.json();
  return {
    apiUrl: authData.apiUrl,
    authToken: authData.authorizationToken,
    downloadUrl: authData.downloadUrl,
  };
}

// Upload to B2
async function uploadToB2(file, mimeType, env, username) {
  try {
    const { apiUrl, authToken } = await getB2Auth(env);
    const uploadResponse = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
      method: 'POST',
      headers: { 'Authorization': authToken },
      body: JSON.stringify({ bucketId: env.B2_BUCKET_ID }),
    });
    if (!uploadResponse.ok) {
      throw new Error('Failed to get upload URL');
    }
    const uploadData = await uploadResponse.json();
    const uploadUrl = uploadData.uploadUrl;
    const uploadAuthToken = uploadData.authorizationToken;

    const fileBuffer = await file.arrayBuffer();
    const fileName = `${username}/${crypto.randomUUID()}.${mimeType.split('/')[1] || 'file'}`;

    const uploadFileResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': uploadAuthToken,
        'Content-Type': mimeType,
        'X-Bz-File-Name': fileName,
        'X-Bz-Content-Sha1': 'do_not_verify',
      },
      body: fileBuffer,
    });

    if (!uploadFileResponse.ok) {
      throw new Error('Failed to upload file');
    }

    const fileData = await uploadFileResponse.json();
    return fileData.fileId;
  } catch (error) {
    console.error('B2 upload error:', error);
    throw error;
  }
}

// Register user
router.post('/api/users/register', async (request, env) => {
  try {
    const { username, email, password } = await request.json();
    if (!username || !email || !password) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const existingUser = await env.DB.prepare('SELECT username FROM users WHERE username = ? OR email = ?')
      .bind(username, email)
      .first();
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Username or email already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const hashedPassword = await hashPassword(password);
    await env.DB.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)')
      .bind(username, email, hashedPassword)
      .run();

    return new Response(JSON.stringify({ message: 'User registered successfully' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Register error:', error);
    return new Response(JSON.stringify({ error: 'Registration failed: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Login user
router.post('/api/users/login', async (request, env) => {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Missing username or password' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const user = await env.DB.prepare('SELECT id, username, password FROM users WHERE username = ?')
      .bind(username)
      .first();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '1d' });
    return new Response(JSON.stringify({ token, username: user.username }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Get all posts
router.get('/api/posts', async (request, env) => {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    let userId = null;
    if (token) {
      try {
        userId = await verifyToken(token, env.JWT_SECRET);
      } catch (error) {
        // Allow unauthenticated access to posts
      }
    }

    const posts = await env.DB.prepare('SELECT id, username, content, media_id, created_at, likes FROM posts ORDER BY created_at DESC')
      .all();
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

// Create post
router.post('/api/posts', async (request, env) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  try {
    const userId = await verifyToken(token, env.JWT_SECRET);
    const { content, mediaId } = await request.json();
    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const user = await env.DB.prepare('SELECT username FROM users WHERE id = ?')
      .bind(userId)
      .first();
    if (!user) {
      return new Response('User not found', { status: 404, headers: corsHeaders });
    }

    if (mediaId) {
      const media = await env.DB.prepare('SELECT username FROM media WHERE media_id = ?')
        .bind(mediaId)
        .first();
      if (!media || media.username !== user.username) {
        return new Response(JSON.stringify({ error: 'Invalid media ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    const result = await env.DB.prepare('INSERT INTO posts (username, content, media_id) VALUES (?, ?, ?) RETURNING *')
      .bind(user.username, content, mediaId || null)
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

// Like post
router.post('/api/posts/:id/like', async (request, env) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  try {
    const userId = await verifyToken(token, env.JWT_SECRET);
    const postId = request.params.id;

    const post = await env.DB.prepare('SELECT likes FROM posts WHERE id = ?')
      .bind(postId)
      .first();
    if (!post) {
      return new Response('Post not found', { status: 404, headers: corsHeaders });
    }

    await env.DB.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?')
      .bind(postId)
      .run();

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

// Edit post
router.put('/api/posts/:id', async (request, env) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  try {
    const userId = await verifyToken(token, env.JWT_SECRET);
    const postId = request.params.id;
    const { content, mediaId } = await request.json();

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const user = await env.DB.prepare('SELECT username FROM users WHERE id = ?')
      .bind(userId)
      .first();
    if (!user) {
      return new Response('User not found', { status: 404, headers: corsHeaders });
    }

    const post = await env.DB.prepare('SELECT username FROM posts WHERE id = ?')
      .bind(postId)
      .first();
    if (!post || post.username !== user.username) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    if (mediaId) {
      const media = await env.DB.prepare('SELECT username FROM media WHERE media_id = ?')
        .bind(mediaId)
        .first();
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

// Delete post
router.delete('/api/posts/:id', async (request, env) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  try {
    const userId = await verifyToken(token, env.JWT_SECRET);
    const postId = request.params.id;

    const user = await env.DB.prepare('SELECT username FROM users WHERE id = ?')
      .bind(userId)
      .first();
    if (!user) {
      return new Response('User not found', { status: 404, headers: corsHeaders });
    }

    const post = await env.DB.prepare('SELECT username FROM posts WHERE id = ?')
      .bind(postId)
      .first();
    if (!post || post.username !== user.username) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    await env.DB.prepare('DELETE FROM posts WHERE id = ?')
      .bind(postId)
      .run();

    return new Response(null, { status: 204, headers: corsHeaders });
  } catch (error) {
    console.error('Delete post error:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete post: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// Get comments
router.get('/api/comments', async (request, env) => {
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

    const comments = await env.DB.prepare('SELECT id, postId, username, content, timestamp, likes FROM comments WHERE postId = ? ORDER BY timestamp ASC')
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

// Create comment
router.post('/api/comments', async (request, env) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  try {
    const userId = await verifyToken(token, env.JWT_SECRET);
    const { postId, content } = await request.json();
    if (!postId || !content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Post ID and content are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const user = await env.DB.prepare('SELECT username FROM users WHERE id = ?')
      .bind(userId)
      .first();
    if (!user) {
      return new Response('User not found', { status: 404, headers: corsHeaders });
    }

    const post = await env.DB.prepare('SELECT id FROM posts WHERE id = ?')
      .bind(postId)
      .first();
    if (!post) {
      return new Response('Post not found', { status: 404, headers: corsHeaders });
    }

    const comment = await env.DB.prepare('INSERT INTO comments (postId, username, content) VALUES (?, ?, ?) RETURNING *')
      .bind(postId, user.username, content)
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

// Like comment
router.post('/api/comments/:id/like', async (request, env) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  try {
    const userId = await verifyToken(token, env.JWT_SECRET);
    const commentId = request.params.id;

    const comment = await env.DB.prepare('SELECT likes FROM comments WHERE id = ?')
      .bind(commentId)
      .first();
    if (!comment) {
      return new Response('Comment not found', { status: 404, headers: corsHeaders });
    }

    await env.DB.prepare('UPDATE comments SET likes = likes + 1 WHERE id = ?')
      .bind(commentId)
      .run();

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

// Get profile
router.get('/api/profile/:username', async (request, env) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  try {
    const userId = await verifyToken(token, env.JWT_SECRET);
    const { username } = request.params;

    const profile = await env.DB.prepare('SELECT username, email, bio, profilePictureUrl FROM users WHERE username = ?')
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

// Update profile
router.put('/api/profile/:username', async (request, env) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401, headers: corsHeaders });

  try {
    const userId = await verifyToken(token, env.JWT_SECRET);
    const { username } = request.params;
    const { bio, profilePictureId } = await request.json();

    const user = await env.DB.prepare('SELECT id, username FROM users WHERE username = ?')
      .bind(username)
      .first();
    if (!user || user.id !== userId) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    if (bio && typeof bio !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid bio' }), {
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

    const updates = [];
    const bindings = [];
    if (bio !== undefined) {
      updates.push('bio = ?');
      bindings.push(bio);
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
      updates.push('profilePictureUrl = ?');
      bindings.push(profilePictureId);
    }

    
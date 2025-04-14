import bcrypt from 'bcryptjs';
import jwt from '@tsndr/cloudflare-worker-jwt';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;
        const db = env.DB;
        const jwtSecret = env.JWT_SECRET;
        const allowedOrigin = 'https://my-social-app.pages.dev';

        const corsHeaders = {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json',
        };

        if (method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        const corsResponse = (data, status = 200) =>
            new Response(JSON.stringify(data), { status, headers: corsHeaders });

        try {
            console.log(`[${new Date().toISOString()}] ${method} ${path}`);

            // USER REGISTRATION
            if (path === '/api/users/register' && method === 'POST') {
                const { username, email, password, bio, profilePictureUrl } = await request.json();
                if (!username || !email || !password) {
                    return corsResponse({ error: 'Missing required fields' }, 400);
                }
                const existingUser = await db.prepare('SELECT username FROM users WHERE username = ? OR email = ?')
                    .bind(username, email)
                    .first();
                if (existingUser) {
                    return corsResponse({ error: 'Username or email already exists' }, 409);
                }
                const hashedPassword = await bcrypt.hash(password, 10);
                await db.prepare(`
                    INSERT INTO users (username, email, password, bio, profilePictureUrl)
                    VALUES (?, ?, ?, ?, ?)
                `).bind(username, email, hashedPassword, bio || null, profilePictureUrl || null).run();
                const token = await jwt.sign({ username }, jwtSecret, { expiresIn: '24h' });
                console.log(`User registered: ${username}`);
                return corsResponse({ message: 'User registered successfully', token, username }, 201);
            }

            // USER LOGIN
            else if (path === '/api/users/login' && method === 'POST') {
                const { username, password } = await request.json();
                if (!username || !password) {
                    return corsResponse({ error: 'Username and password required' }, 400);
                }
                const user = await db.prepare('SELECT * FROM users WHERE username = ?')
                    .bind(username)
                    .first();
                if (!user || !(await bcrypt.compare(password, user.password))) {
                    return corsResponse({ error: 'Invalid username or password' }, 401);
                }
                const token = await jwt.sign({ username: user.username }, jwtSecret, { expiresIn: '24h' });
                console.log(`User logged in: ${username}`);
                return corsResponse({ message: 'Login successful', token, username: user.username });
            }

            // UPLOAD MEDIA TO B2
            else if (path === '/api/upload' && method === 'POST') {
                const { extractedUsername, authError } = await verifyToken(request, jwtSecret);
                if (authError) return corsResponse(authError, 401);

                const formData = await request.formData();
                const file = formData.get('file');
                if (!file) return corsResponse({ error: 'File is required' }, 400);

                // Limit size to 100MB
                if (file.size > 100 * 1024 * 1024) {
                    return corsResponse({ error: 'File exceeds 100MB' }, 400);
                }

                // Authenticate B2
                const authResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
                    headers: {
                        Authorization: `Basic ${btoa(`${env.B2_KEY_ID}:${env.B2_APPLICATION_KEY}`)}`
                    }
                });
                const authData = await authResponse.json();
                if (!authData.authorizationToken) {
                    return corsResponse({ error: 'B2 auth failed' }, 500);
                }

                // Get upload URL
                const uploadUrlResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_get_upload_url`, {
                    method: 'POST',
                    headers: { Authorization: authData.authorizationToken },
                    body: JSON.stringify({ bucketId: authData.allowed.bucketId })
                });
                const uploadUrlData = await uploadUrlResponse.json();

                // Upload file
                const mediaId = `${extractedUsername}-${Date.now()}-${file.name}`;
                const uploadResponse = await fetch(uploadUrlData.uploadUrl, {
                    method: 'POST',
                    headers: {
                        Authorization: uploadUrlData.authorizationToken,
                        'Content-Type': file.type,
                        'X-Bz-File-Name': encodeURIComponent(mediaId),
                        'X-Bz-Content-Sha1': 'do_not_verify',
                        'X-Bz-Server-Side-Encryption': 'AES256'
                    },
                    body: file.stream()
                });
                const uploadData = await uploadResponse.json();
                if (!uploadData.fileId) {
                    return corsResponse({ error: 'Upload failed' }, 500);
                }

                // Save to D1
                await db.prepare(`
                    INSERT INTO media (username, media_id, mime_type, created_at)
                    VALUES (?, ?, ?, ?)
                `).bind(extractedUsername, mediaId, file.type, new Date().toISOString()).run();

                // Presigned URL
                const presignedUrl = `${authData.downloadUrl}/file/${env.B2_BUCKET_NAME}/${encodeURIComponent(mediaId)}?Authorization=${authData.authorizationToken}`;

                console.log(`Media uploaded by ${extractedUsername}: ${mediaId}`);
                return corsResponse({ media_id: mediaId, url: presignedUrl, message: 'Uploaded' }, 201);
            }

            // RETRIEVE MEDIA FROM B2
            else if (path.startsWith('/api/media/') && method === 'GET') {
                const { extractedUsername, authError } = await verifyToken(request, jwtSecret);
                if (authError) return corsResponse(authError, 401);

                const mediaId = path.split('/')[3];
                const media = await db.prepare('SELECT media_id, mime_type, username FROM media WHERE media_id = ?')
                    .bind(mediaId)
                    .first();

                if (!media) {
                    return corsResponse({ error: 'Media not found' }, 404);
                }

                // Restrict to owner
                if (media.username !== extractedUsername) {
                    return corsResponse({ error: 'Unauthorized' }, 403);
                }

                // Authenticate B2
                const authResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
                    headers: {
                        Authorization: `Basic ${btoa(`${env.B2_KEY_ID}:${env.B2_APPLICATION_KEY}`)}`
                    }
                });
                const authData = await authResponse.json();
                if (!authData.authorizationToken) {
                    return corsResponse({ error: 'B2 auth failed' }, 500);
                }

                // Presigned URL
                const presignedUrl = `${authData.downloadUrl}/file/${env.B2_BUCKET_NAME}/${encodeURIComponent(media.media_id)}?Authorization=${authData.authorizationToken}`;

                return corsResponse({ url: presignedUrl, mime_type: media.mime_type });
            }

            // POST CREATION
            else if (path === '/api/posts' && method === 'POST') {
                const { extractedUsername, authError } = await verifyToken(request, jwtSecret);
                if (authError) return corsResponse(authError, 401);
                const { content, mediaId } = await request.json();
                if (!content) return corsResponse({ error: 'Content is required' }, 400);
                let media = null;
                if (mediaId) {
                    media = await db.prepare('SELECT media_id, username FROM media WHERE media_id = ?')
                        .bind(mediaId)
                        .first();
                    if (!media || media.username !== extractedUsername) {
                        return corsResponse({ error: 'Invalid or unauthorized media' }, 400);
                    }
                }
                const result = await db.prepare(`
                    INSERT INTO posts (username, content, media_id, created_at, likes)
                    VALUES (?, ?, ?, datetime('now'), 0)
                    RETURNING id, username, content, media_id, created_at, likes
                `).bind(extractedUsername, content, mediaId || null).first();
                console.log('Post created:', result);
                return corsResponse(result, 201);
            }

            // GET ALL POSTS
            else if (path === '/api/posts' && method === 'GET') {
                const results = await db.prepare(`
                    SELECT id, username, content, media_id, created_at, likes 
                    FROM posts 
                    ORDER BY created_at DESC
                `).all();
                return corsResponse(results.results);
            }

            // LIKE A POST
            else if (path.startsWith('/api/posts/') && path.endsWith('/like') && method === 'POST') {
                const { extractedUsername, authError } = await verifyToken(request, jwtSecret);
                if (authError) return corsResponse(authError, 401);
                const postId = path.split('/')[3];
                const post = await db.prepare('SELECT likes FROM posts WHERE id = ?').bind(postId).first();
                if (!post) return corsResponse({ error: 'Post not found' }, 404);
                await db.prepare('UPDATE posts SET likes = likes + 1 WHERE id = ?').bind(postId).run();
                const updatedPost = await db.prepare('SELECT likes FROM posts WHERE id = ?').bind(postId).first();
                console.log(`Post ${postId} liked by ${extractedUsername}`);
                return corsResponse({ message: 'Post liked', likes: updatedPost.likes });
            }

            // EDIT A POST
            else if (path.startsWith('/api/posts/') && method === 'PUT') {
                const { extractedUsername, authError } = await verifyToken(request, jwtSecret);
                if (authError) return corsResponse(authError, 401);
                const postId = path.split('/')[3];
                const { content, mediaId } = await request.json();
                if (!content) return corsResponse({ error: 'Content is required' }, 400);
                const post = await db.prepare('SELECT username FROM posts WHERE id = ?').bind(postId).first();
                if (!post) return corsResponse({ error: 'Post not found' }, 404);
                if (post.username !== extractedUsername) return corsResponse({ error: 'Unauthorized' }, 403);
                let media = null;
                if (mediaId) {
                    media = await db.prepare('SELECT media_id, username FROM media WHERE media_id = ?')
                        .bind(mediaId)
                        .first();
                    if (!media || media.username !== extractedUsername) {
                        return corsResponse({ error: 'Invalid or unauthorized media' }, 400);
                    }
                }
                await db.prepare('UPDATE posts SET content = ?, media_id = ?, created_at = datetime("now") WHERE id = ?')
                    .bind(content, mediaId || null, postId)
                    .run();
                const updatedPost = await db.prepare('SELECT id, username, content, media_id, created_at, likes FROM posts WHERE id = ?')
                    .bind(postId)
                    .first();
                console.log(`Post ${postId} edited by ${extractedUsername}`);
                return corsResponse(updatedPost);
            }

            // DELETE A POST
            else if (path.startsWith('/api/posts/') && method === 'DELETE') {
                const { extractedUsername, authError } = await verifyToken(request, jwtSecret);
                if (authError) return corsResponse(authError, 401);
                const postId = path.split('/')[3];
                const post = await db.prepare('SELECT username FROM posts WHERE id = ?').bind(postId).first();
                if (!post) return corsResponse({ error: 'Post not found' }, 404);
                if (post.username !== extractedUsername) return corsResponse({ error: 'Unauthorized' }, 403);
                await db.prepare('DELETE FROM posts WHERE id = ?').bind(postId).run();
                await db.prepare('DELETE FROM comments WHERE postId = ?').bind(postId).run();
                console.log(`Post ${postId} deleted by ${extractedUsername}`);
                return corsResponse({ message: 'Post deleted' });
            }

            // POST COMMENTS
            else if (path === '/api/comments' && method === 'POST') {
                const { extractedUsername, authError } = await verifyToken(request, jwtSecret);
                if (authError) return corsResponse(authError, 401);
                const { postId, content } = await request.json();
                if (!postId || !content) return corsResponse({ error: 'postId and content required' }, 400);
                const postExists = await db.prepare('SELECT id FROM posts WHERE id = ?').bind(postId).first();
                if (!postExists) return corsResponse({ error: 'Post not found' }, 404);
                const result = await db.prepare(`
                    INSERT INTO comments (postId, username, content, timestamp, likes)
                    VALUES (?, ?, ?, datetime('now'), 0)
                    RETURNING id, postId, username, content, timestamp, likes
                `).bind(postId, extractedUsername, content).first();
                console.log('Comment created:', result);
                return corsResponse(result, 201);
            }

            // GET COMMENTS FOR A POST
            else if (path === '/api/comments' && method === 'GET') {
                const postId = url.searchParams.get('postId');
                if (!postId) return corsResponse({ error: 'postId is required' }, 400);
                const results = await db.prepare(`
                    SELECT id, postId, username, content, timestamp, likes 
                    FROM comments 
                    WHERE postId = ? 
                    ORDER BY timestamp ASC
                `).bind(postId).all();
                return corsResponse(results.results);
            }

            // LIKE A COMMENT
            else if (path.startsWith('/api/comments/') && path.endsWith('/like') && method === 'POST') {
                const { extractedUsername, authError } = await verifyToken(request, jwtSecret);
                if (authError) return corsResponse(authError, 401);
                const commentId = path.split('/')[3];
                const comment = await db.prepare('SELECT likes FROM comments WHERE id = ?').bind(commentId).first();
                if (!comment) return corsResponse({ error: 'Comment not found' }, 404);
                await db.prepare('UPDATE comments SET likes = likes + 1 WHERE id = ?').bind(commentId).run();
                const updatedComment = await db.prepare('SELECT likes FROM comments WHERE id = ?').bind(commentId).first();
                console.log(`Comment ${commentId} liked by ${extractedUsername}`);
                return corsResponse({ message: 'Comment liked', likes: updatedComment.likes });
            }

            // USER PROFILE FETCH
            else if (path.startsWith('/api/profile/') && method === 'GET') {
                const username = path.split('/').pop();
                const userProfile = await db.prepare(`
                    SELECT username, email, bio, profilePictureUrl 
                    FROM users 
                    WHERE username = ?
                `).bind(username).first();
                return userProfile
                    ? corsResponse(userProfile)
                    : corsResponse({ error: 'Profile not found' }, 404);
            }

            // FETCH ALL USERS
            else if (path === '/api/data' && method === 'GET') {
                const { authError } = await verifyToken(request, jwtSecret);
                if (authError) return corsResponse(authError, 401);
                const results = await db.prepare(`
                    SELECT id, username, email 
                    FROM users
                `).all();
                return corsResponse(results.results);
            }

            return corsResponse({ message: 'Not found' }, 404);
        } catch (error) {
            console.error(`Server error at ${path}:`, error.message);
            return corsResponse({ error: 'Server error', details: error.message }, 500);
        }
    },
};

async function verifyToken(request, jwtSecret) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authError: { error: 'Unauthorized: No token provided' } };
    }
    const token = authHeader.substring(7);
    const isValid = await jwt.verify(token, jwtSecret);
    if (!isValid) {
        return { authError: { error: 'Unauthorized: Invalid token' } };
    }
    try {
        const decoded = await jwt.decode(token);
        const extractedUsername = decoded.payload.username;
        if (!extractedUsername) {
            return { authError: { error: 'Unauthorized: Invalid token (missing username)' } };
        }
        return { extractedUsername };
    } catch (jwtError) {
        return { authError: { error: 'Unauthorized: Invalid token' } };
    }
}
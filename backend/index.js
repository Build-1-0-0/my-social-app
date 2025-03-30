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
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Content-Type': 'application/json',
        };

        if (method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        const corsResponse = (data, status = 200) => 
            new Response(JSON.stringify(data), { status, headers: corsHeaders });

        try {
            console.log(`Incoming request: ${method} ${path}`);

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

                console.log(`User registered: ${username}`);
                return corsResponse({ message: 'User registered successfully' }, 201);
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

                const token = await jwt.sign({ username: user.username }, jwtSecret, {
                    expiresIn: '24h'
                });

                console.log(`User logged in: ${username}`);
                return corsResponse({ message: 'Login successful', token, username: user.username });
            }

            // POST CREATION
            else if (path === '/api/posts' && method === 'POST') {
                const { extractedUsername, authError } = await verifyToken(request, jwtSecret);
                if (authError) return corsResponse(authError, 401);

                const { content } = await request.json();
                if (!content) return corsResponse({ error: 'Content is required' }, 400);

                const result = await db.prepare(`
                    INSERT INTO posts (username, content)
                    VALUES (?, ?)
                    RETURNING id, username, content, created_at
                `).bind(extractedUsername, content).first();

                return corsResponse(result, 201);
            }

            // GET ALL POSTS
            else if (path === '/api/posts' && method === 'GET') {
                const results = await db.prepare(`
                    SELECT id, username, content, created_at 
                    FROM posts 
                    ORDER BY created_at DESC
                `).all();

                return corsResponse(results.results);
            }

            // POST COMMENTS
            else if (path === '/api/comments' && method === 'POST') {
                const { extractedUsername, authError } = await verifyToken(request, jwtSecret);
                if (authError) return corsResponse(authError, 401);

                const { postId, content } = await request.json();
                if (!postId || !content) return corsResponse({ error: 'postId and content required' }, 400);

                const postExists = await db.prepare('SELECT id FROM posts WHERE id = ?')
                    .bind(postId)
                    .first();
                if (!postExists) return corsResponse({ error: 'Post not found' }, 404);

                const result = await db.prepare(`
                    INSERT INTO comments (postId, username, content)
                    VALUES (?, ?, ?)
                    RETURNING id, postId, username, content, timestamp
                `).bind(postId, extractedUsername, content).first();

                return corsResponse(result, 201);
            }

            // GET COMMENTS FOR A POST
            else if (path === '/api/comments' && method === 'GET') {
                const postId = url.searchParams.get('postId');
                if (!postId) return corsResponse({ error: 'postId is required' }, 400);

                const results = await db.prepare(`
                    SELECT id, username, content, timestamp 
                    FROM comments 
                    WHERE postId = ? 
                    ORDER BY timestamp ASC
                `).bind(postId).all();

                return corsResponse(results.results);
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
            console.error("Server error:", error);
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
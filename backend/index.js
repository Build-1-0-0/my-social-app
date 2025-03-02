import bcrypt from 'bcryptjs';
import jwt from '@tsndr/cloudflare-worker-jwt';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;
        const db = env.DB;
        const origin = 'https://my-social-app.pages.dev'; // Replace with your frontend URL if different
        const jwtSecret = env.JWT_SECRET;

        const corsResponse = (response, status = 200) => {
            const headers = {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Content-Type': 'application/json',
            };
            return new Response(JSON.stringify(response), { status, headers });
        };

        if (method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            });
        }

        try {
            console.log(`Incoming request: ${method} ${path}`);

            if (path === '/api/users/register' && method === 'POST') {
                const { username, email, password, bio, profilePictureUrl } = await request.json();

                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                await db.prepare('INSERT INTO users (username, email, password, bio, profilePictureUrl) VALUES (?, ?, ?, ?, ?)').bind(
                    username,
                    email,
                    hashedPassword,
                    bio || null,
                    profilePictureUrl || null
                ).run();

                console.log(`User registered: ${username}`);
                return corsResponse({ message: 'User registered successfully' }, 201);

            } else if (path === '/api/users/login' && method === 'POST') {
                const { username, password } = await request.json();
                console.log("Login Request:", JSON.stringify({ username, password }));
                const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
                console.log("Database User:", JSON.stringify(user));

                if (user && await bcrypt.compare(password, user.password)) {
                    console.log("bcrypt compare success");
                    console.log(`User logged in: ${username}`);
                    console.log("DEBUG: User.username before token generation:", user.username);
                    const token = await jwt.sign({ username: user.username }, jwtSecret);
                    console.log("JWT Token Generated:", token);
                    return corsResponse({ message: 'Login successful', token, username: user.username }); // <--- Return username in login response
                } else {
                    console.log("bcrypt compare failed");
                    return corsResponse({ error: 'Invalid username or password' }, 401);
                }
            } else if (path === '/api/data' && method === 'GET') {
                const authHeader = request.headers.get('Authorization');
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return corsResponse({ error: 'Unauthorized' }, 401);
                }
                const token = authHeader.substring(7);
                const isValid = await jwt.verify(token, jwtSecret);
                if (!isValid) {
                    return corsResponse({ error: 'Unauthorized' }, 401);
                }
                const results = await db.prepare('SELECT id, username, email FROM users').all();
                const data = results.results;
                return corsResponse(data);
            } else if (path === '/api/posts' && method === 'POST') {
                const authHeader = request.headers.get('Authorization');
                console.log("DEBUG: Authorization Header:", authHeader);
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return corsResponse({ error: 'Unauthorized' }, 401);
                }
                const token = authHeader.substring(7);
                const isValid = await jwt.verify(token, jwtSecret);
                console.log("DEBUG: jwt.verify result:", isValid);
                if (!isValid) {
                    return corsResponse({ error: 'Unauthorized' }, 401);
                }

                let extractedUsername;
                try {
                    const decodedToken = await jwt.decode(token, jwtSecret);
                    console.log("DEBUG: Decoded Token:", decodedToken);
                    console.log("DEBUG: typeof extractedUsername:", typeof decodedToken.payload.username);
                    extractedUsername = decodedToken.payload.username;
                    if (extractedUsername === undefined) {
                        console.error("JWT missing username claim");
                        return corsResponse({ error: 'Unauthorized: Invalid token (missing username)' }, 401);
                    }
                } catch (jwtError) {
                    console.error("JWT decode error:", jwtError);
                    return corsResponse({ error: 'Unauthorized: Invalid token' }, 401);
                }

                const { content } = await request.json();

                console.log("DEBUG: extractedUsername before insertion:", extractedUsername);
                const preparedStatement = db.prepare('INSERT INTO posts (username, content) VALUES (?, ?) RETURNING id, username, content');
                console.log("DEBUG: Prepared statement created");
                const boundStatement = preparedStatement.bind(extractedUsername, content);
                console.log("DEBUG: Statement bound");

                try {
                    const result = await boundStatement.first();
                    console.log("DEBUG: Database INSERT result:", JSON.stringify(result));
                    return corsResponse(result, 201);
                } catch (dbError) {
                    console.error("Database error:", dbError);
                    return corsResponse({ error: 'Database error' }, 500);
                }
            } else if (path === '/api/posts' && method === 'GET') {
                const authHeader = request.headers.get('Authorization');
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return corsResponse({ error: 'Unauthorized' }, 401);
                }
                const token = authHeader.substring(7);
                const isValid = await jwt.verify(token, jwtSecret);
                if (!isValid) {
                    return corsResponse({ error: 'Unauthorized' }, 401);
                }
                const results = await db.prepare('SELECT id, username, content FROM posts ORDER BY id DESC').all();
                const data = results.results;
                return corsResponse(data);
            } else if (path === '/api/comments' && method === 'POST') {
                const authHeader = request.headers.get('Authorization');
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return corsResponse({ error: 'Unauthorized' }, 401);
                }
                const token = authHeader.substring(7);
                const isValid = await jwt.verify(token, jwtSecret);
                if (!isValid) {
                    return corsResponse({ error: 'Unauthorized' }, 401);
                }

                let extractedUsername;
                try {
                    const decodedToken = await jwt.decode(token, jwtSecret);
                    extractedUsername = decodedToken.payload.username;
                    if (extractedUsername === undefined) {
                        return corsResponse({ error: 'Unauthorized: Invalid token (missing username)' }, 401);
                    }
                } catch (jwtError) {
                    return corsResponse({ error: 'Unauthorized: Invalid token' }, 401);
                }

                const { postId, content } = await request.json();

                try {
                    const result = await db.prepare('INSERT INTO comments (postId, username, content) VALUES (?, ?, ?) RETURNING id, postId, username, content, timestamp').bind(postId, extractedUsername, content).first();
                    return corsResponse(result, 201);
                } catch (dbError) {
                    console.error("Database error:", dbError);
                    return corsResponse({ error: 'Database error' }, 500);
                }
            } else if (path === '/api/comments' && method === 'GET') {
                const postId = url.searchParams.get('postId');
                if (!postId) {
                    return corsResponse({ error: 'postId is required' }, 400);
                }

                try {
                    const results = await db.prepare('SELECT id, username, content, timestamp FROM comments WHERE postId = ? ORDER BY timestamp ASC').bind(postId).all();
                    const data = results.results;
                    return corsResponse(data);
                } catch (dbError) {
                    console.error("Database error:", dbError);
                    return corsResponse({ error: 'Database error' }, 500);
                }
            } else if (path.startsWith('/api/profile/') && method === 'GET') { // <--- Profile Endpoint
                const username = path.split('/').pop();
                console.log(`Fetching profile for username: ${username}`);

                // ***  HARDCODED JSON RESPONSE FOR TESTING - REPLACE ENTIRE BLOCK WITH THIS ***
                const hardcodedProfileData = {
                    username: "testuser_HARDCODED",
                    email: "testuser_HARDCODED@example.com",
                    message: "This is a hardcoded JSON response for testing!"
                };
                return corsResponse(hardcodedProfileData);

                // *** COMMENT OUT OR DELETE THE ORIGINAL DATABASE FETCHING CODE (BELOW) ***
                // const userProfile = await db.prepare('SELECT username, email, bio, profilePictureUrl FROM users WHERE username = ?').bind(username).first();
                // if (userProfile) {
                //     console.log(`Profile found for username: ${username}`, JSON.stringify(userProfile));
                //     return corsResponse(userProfile);
                // } else {
                //     console.log(`Profile not found for username: ${username}`);
                //     return corsResponse({ error: 'Profile not found' }, 404);
                // }
            } else if (path === '/') {
                return new Response('Welcome to my Cloudflare Worker!', {
                    headers: { 'Content-Type': 'text/plain' },
                });
            } else {
                return new Response('Not Found', { status: 404 });
            }
        } catch (err) {
            console.error(`Worker error: ${err.message}`, err);
            return corsResponse({ error: err.message }, 500);
        }
    },
};

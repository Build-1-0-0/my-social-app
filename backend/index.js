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
                    console.log("DEBUG: jwtSecret in /api/login:", jwtSecret); // <---- DEBUG LOG: JWT SECRET IN LOGIN
                    const token = await jwt.sign({ username: user.username }, jwtSecret);
                    console.log("JWT Token Generated:", token);
                    return corsResponse({ message: 'Login successful', token, username: user.username });
                } else {
                    console.log("bcrypt compare failed");
                    return corsResponse({ error: 'Invalid username or password' }, 401);
                }
            } else if (path === '/api/posts' && method === 'POST') { // <---- /api/posts POST is now correctly in the chain
                const authHeader = request.headers.get('Authorization');
                console.log("DEBUG: Authorization Header:", authHeader);
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return corsResponse({ error: 'Unauthorized' }, 401);
                }
                const token = authHeader.substring(7);
                const isValid = await jwt.verify(token, jwtSecret);
                console.log("DEBUG: jwtSecret in /api/posts (verification):", jwtSecret);

                if (!isValid) {
                    return corsResponse({ error: 'Unauthorized' }, 401);
                }

                let extractedUsername; // <---- 'extractedUsername' and try/catch are now inside /api/posts POST where they are used.
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
            } else if (path === '/api/posts' && method === 'GET') { // <---- /api/posts GET is now correctly in the chain
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
            } else if (path === '/api/comments' && method === 'POST') { // <---- /api/comments POST is now correctly in the chain
                const authHeader = request.headers.get('Authorization');
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return corsResponse({ error: 'Unauthorized' }, 401);
                }
                const token = authHeader.substring(7);
                const isValid = await jwt.verify(token, jwtSecret);
                if (!isValid) {
                    return corsResponse({ error: 'Unauthorized' }, 401);
                }

                let extractedUsername; // <---- 'extractedUsername' and try/catch are now inside /api/comments POST where they are used.
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
            } else if (path === '/api/comments' && method === 'GET') { // <---- /api/comments GET is now correctly in the chain
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
            } else if (path.startsWith('/api/profile/') && method === 'GET') { // <--- Profile Endpoint is now correctly in the chain
                const username = path.split('/').pop();
                console.log(`Fetching profile for username: ${username}`);

                const userProfile = await db.prepare('SELECT username, email, bio, profilePictureUrl FROM users WHERE username = ?').bind(username).first();
                if (userProfile) {
                    console.log(`Profile found for username: ${username}`, JSON.stringify(userProfile));
                    return corsResponse(userProfile);
                } else {
                    console.log(`Profile not found for username: ${username}`);
                    return corsResponse({ error: 'Profile not found' }, 404);
                }
            } else if (path === '/api/data' && method === 'GET') { // <---- THIS IS THE NEWLY ADDED BLOCK - /api/data ENDPOINT
                const authHeader = request.headers.get('Authorization');
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return corsResponse({ error: 'Unauthorized' }, 401);
                }
                const token = authHeader.substring(7);
                const isValid = await jwt.verify(token, jwtSecret);
                if (!isValid) {
                    return corsResponse({ error: 'Unauthorized' }, 401);
                }

                try {
                    // Fetch user data from your database here.
                    // IMPORTANT: Decide what user data you want to return.
                    // For this example, I'm assuming you want to return a list of all users (username and email).
                    // You might need to adjust the SQL query and the data you return based on your needs.

                    const results = await db.prepare('SELECT id, username, email FROM users').all(); // <---- Example SQL query to fetch users
                    const usersData = results.results;
                    return corsResponse(usersData); // <---- Return user data as JSON
                } catch (dbError) {
                    console.error("Database error fetching user data:", dbError);
                    return corsResponse({ error: 'Database error fetching user data' }, 500);
                }
            } else { // <---- The final 'else' block for 'Not found' - REMAINS AT THE END
                return corsResponse({ message: 'Not found' }, 404);
            }

        } catch (error) {
            console.error("Server error:", error);
            return corsResponse({ error: 'Server error' }, 500);
        }
    },
};
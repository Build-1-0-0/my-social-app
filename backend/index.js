import bcrypt from 'bcryptjs';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;
        const db = env.DB;
        const origin = 'https://my-social-app.pages.dev';

        // Helper function to send CORS responses
        const corsResponse = (response, status = 200) => {
            const headers = {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json',
            };
            return new Response(JSON.stringify(response), { status, headers });
        };

        // CORS Preflight Request Handling
        if (method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': origin,
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }

        try {
            console.log(`Incoming request: ${method} ${path}`); // Log request details

            if (path === '/api/users/register' && method === 'POST') {
                const { username, email, password } = await request.json();
                const saltRounds = 10; // Or env.SALT_ROUNDS
                const hashedPassword = await bcrypt.hash(password, saltRounds);
                await db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').bind(username, email, hashedPassword).run();
                console.log(`User registered: ${username}`); // Log successful registration
                return corsResponse({ message: 'User registered successfully' }, 201);
            } else if (path === '/api/users/login' && method === 'POST') {
                const { username, password } = await request.json();
                const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
                if (user && await bcrypt.compare(password, user.password)) {
                    console.log(`User logged in: ${username}`); // Log successful login
                    return corsResponse({ message: 'Login successful' });
                } else {
                    return corsResponse({ error: 'Invalid username or password' }, 401);
                }
            } else if (path === '/api/data' && method === 'GET') {
                const results = await db.prepare('SELECT * FROM users').all();
                const data = results.results;
                return corsResponse(data);
            } else if (path === '/') { //Added root route.
                return new Response("Welcome to my Cloudflare Worker!", {
                    headers: { 'Content-Type': 'text/plain' },
                });
            } else {
                return new Response('Not Found', { status: 404 });
            }
        } catch (err) {
            console.error(`Worker error: ${err.message}`, err); // Log error with context
            return corsResponse({ error: err.message }, 500);
        }
    },
};

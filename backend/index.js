// backend/index.js (Cloudflare Worker)
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;
        const db = env.DB; // Access your D1 database

        // CORS Preflight Request Handling
        if (method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': 'https://my-social-app.pages.dev',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }

        let response = null; // Initialize the response variable

        try {
            if (path === '/api/users/register' && method === 'POST') {
                const { username, email, password } = await request.json();
                // Replace with your actual D1 database register logic:
                await db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').bind(username, email, password).run();

                response = new Response(JSON.stringify({ message: 'User registered successfully' }), {
                    status: 201,
                    headers: { 'Content-Type': 'application/json' },
                });
            } else if (path === '/api/users/login' && method === 'POST') {
                const { username, password } = await request.json();
                // Replace with your actual D1 database login logic:
                const user = await db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').bind(username, password).first();

                if (user) {
                    response = new Response(JSON.stringify({ message: 'Login successful' }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    });
                } else {
                    response = new Response(JSON.stringify({ error: 'Invalid username or password' }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
            } else if (path === '/api/data' && method === 'GET') {
                const results = await db.prepare('SELECT * FROM users').all();
                const data = results.results;
                response = new Response(JSON.stringify(data), {
                    headers: { 'Content-Type': 'application/json' },
                });
            } else {
                response = new Response('Not Found', { status: 404 });
            }
        } catch (err) {
            console.error('Worker error:', err);
            response = new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Add CORS headers to all responses
        if (response) {
            const newHeaders = new Headers(response.headers);
            newHeaders.set('Access-Control-Allow-Origin', 'https://my-social-app.pages.dev');
            return new Response(response.body, {
                status: response.status,
                headers: newHeaders,
            });
        }

        return new Response('Not Found', { status: 404 });
    },
};

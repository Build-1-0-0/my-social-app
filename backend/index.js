// backend/index.js (Cloudflare Worker)
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const db = env.DB; // Access your D1 database

        // CORS Preflight Request Handling
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': 'https://a6010c9b.my-social-app.pages.dev', // Replace with your allowed origin
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }

        let response = null; // Initialize the response variable

        try {
            if (path === '/api/users/register' && request.method === 'POST') {
                // Your register code here. Example:
                const { username, email, password } = await request.json();
                // ... your D1 database register logic
                response = new Response(JSON.stringify({ message: 'User registered successfully' }), {
                    status: 201,
                    headers: { 'Content-Type': 'application/json' },
                });
            } else if (path === '/api/users/login' && request.method === 'POST') {
                // Your login code here. Example:
                const { username, password } = await request.json();
                // ... your D1 database login logic
                response = new Response(JSON.stringify({ message: 'Login successful' }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            } else if (path === '/api/data') {
                // your data retrieval logic
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
            newHeaders.set('Access-Control-Allow-Origin', 'https://a6010c9b.my-social-app.pages.dev'); // Use the correct origin
            return new Response(response.body, {
                status: response.status,
                headers: newHeaders,
            });
        }

        return new Response('Not Found', { status: 404 });
    },
};

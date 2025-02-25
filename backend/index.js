// backend/index.js (Cloudflare Worker)
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const db = env.DB; // Access the D1 database

        if (path === '/') {
            return new Response('Social Media Backend is running!');
        }

        if (path === '/api/users/register' && request.method === 'POST') {
            try {
                const { username, email, password } = await request.json();
                const existingUser = await db
                    .prepare('SELECT * FROM users WHERE username = ? OR email = ?')
                    .bind(username, email)
                    .first();

                if (existingUser) {
                    return new Response(JSON.stringify({ error: 'Username or email already exists' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }

                const result = await db
                    .prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)')
                    .bind(username, email, password)
                    .run();

                return new Response(JSON.stringify({ message: 'User registered successfully' }), {
                    status: 201,
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (err) {
                console.error('Registration Error:', err);
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        if (path === '/api/users/login' && request.method === 'POST') {
            try {
                const { username, password } = await request.json();
                const user = await db
                    .prepare('SELECT * FROM users WHERE username = ? AND password = ?')
                    .bind(username, password)
                    .first();

                if (!user) {
                    return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }

                return new Response(JSON.stringify({ message: 'Login successful' }), {
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (err) {
                console.error('Login Error:', err);
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        return new Response('Not Found', { status: 404 });
    },
};

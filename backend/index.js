// backend/index.js (Cloudflare Worker)
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const db = env.DB;

        // CORS Preflight Request Handling
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': 'https://my-social-app.pages.dev', // Replace with your allowed origin
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            });
        }

        // ... your existing API endpoint code

        // Add CORS headers to all responses
        const response = /* Your API endpoint response */;
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

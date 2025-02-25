// backend/index.js (Cloudflare Worker)
export default {
    async fetch(request, env, ctx) {
        // ... your code
        if(path === "/api/users/register" && request.method === "POST"){
            // your register code.
            const response = new Response(JSON.stringify({message: "test"}), {status: 200, headers: {'Content-Type': 'application/json'}});
            if (response) {
                const newHeaders = new Headers(response.headers);
                newHeaders.set('Access-Control-Allow-Origin', 'https://my-social-app.pages.dev');
                return new Response(response.body, {
                    status: response.status,
                    headers: newHeaders,
                });
            }
        }
        if(path === "/api/users/login" && request.method === "POST"){
            // your login code.
            const response = new Response(JSON.stringify({message: "test"}), {status: 200, headers: {'Content-Type': 'application/json'}});
            if (response) {
                const newHeaders = new Headers(response.headers);
                newHeaders.set('Access-Control-Allow-Origin', 'https://my-social-app.pages.dev');
                return new Response(response.body, {
                    status: response.status,
                    headers: newHeaders,
                });
            }
        }
        // ... your code.
    }
}

export function handleCors(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = ['https://my-social-app.pages.dev', 'http://localhost:3000'];

  const headers = {
    ...corsHeaders,
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'null',
  };

  if (request.method === 'OPTIONS') {
    // Immediate response for preflight
    return new Response(null, { status: 204, headers });
  }

  // Wrapper to add headers to other responses
  return async function(response) {
    if (!(response instanceof Response)) {
      response = new Response(JSON.stringify({ error: 'Invalid response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...headers },
      });
    }
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  };
}

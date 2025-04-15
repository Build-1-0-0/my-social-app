export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export function handleCors(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = ['https://my-social-app.pages.dev', 'http://localhost:3000'];

  const headers = {
    ...corsHeaders,
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'null',
  };

  // Handle OPTIONS requests directly
  if (request.method === 'OPTIONS') {
    return Promise.resolve(new Response(null, { headers, status: 204 }));
  }

  // Return a function to wrap responses for other methods
  return async (response) => {
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
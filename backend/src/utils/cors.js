const corsHeaders = {
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

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  return (response) => {
    if (!(response instanceof Response)) {
      response = new Response(JSON.stringify(response || { error: 'Invalid response' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  };
}

export { corsHeaders };
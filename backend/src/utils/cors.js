export function handleCors(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = ['https://my-social-app.pages.dev', 'http://localhost:3000'];

  const headers = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 204 });
  }

  return (response) => {
    if (response instanceof Response) {
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }
    return new Response(JSON.stringify(response), { headers });
  };
}
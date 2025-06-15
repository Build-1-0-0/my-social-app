// src/utils/cors.js

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS,PUT,DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// This function handles CORS preflight requests
export function handleCors(request) {
  if (request.method === 'OPTIONS') {
    return () =>
      new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
  }

  // Return a function that adds CORS headers to any response
  return (response) => {
    const newHeaders = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders)) {
      newHeaders.set(key, value);
    }
    return new Response(response.body, {
      ...response,
      headers: newHeaders,
    });
  };
}

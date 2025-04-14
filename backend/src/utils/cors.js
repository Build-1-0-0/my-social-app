export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://my-social-app.pages.dev',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function handleOptions() {
  return new Response(null, { headers: corsHeaders });
}

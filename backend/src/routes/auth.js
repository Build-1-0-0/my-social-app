import { verify } from 'jsonwebtoken';
import { corsHeaders } from './cors';

/**
 * Authenticate a request using JWT in the Authorization header.
 * Expects "Authorization: Bearer <token>".
 * Throws a Response object with 401 if invalid or missing.
 * 
 * @param {Request} request - The incoming request
 * @param {Env} env - Cloudflare Worker environment bindings
 * @returns {Object} - The decoded JWT payload if valid
 */
export function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw Object.assign(new Error('Unauthorized'), {
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }),
    });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = verify(token, env.JWT_SECRET);
    return decoded;
  } catch (err) {
    throw Object.assign(new Error('Invalid token'), {
      response: new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }),
    });
  }
}
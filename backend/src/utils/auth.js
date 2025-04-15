import { verify } from 'jsonwebtoken';
import { corsHeaders } from './cors';

export function authenticate(request, env) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    throw Object.assign(new Error('Unauthorized'), {
      response: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }),
    });
  }
  try {
    return verify(token, env.JWT_SECRET);
  } catch (err) {
    throw Object.assign(new Error('Invalid token'), {
      response: new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }),
    });
  }
}
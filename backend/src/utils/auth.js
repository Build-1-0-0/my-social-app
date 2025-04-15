import { hash, compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { corsHeaders } from '../utils/cors';

const TOKEN_EXPIRY = '1d';

export async function login(request, env) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return jsonResponse({ error: 'Email and password required' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await env.social_app_db
      .prepare('SELECT id, username, password FROM users WHERE email = ?')
      .bind(normalizedEmail)
      .first();

    if (!user) {
      return jsonResponse({ error: 'User not found' }, 404);
    }

    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      return jsonResponse({ error: 'Invalid password' }, 401);
    }

    const token = sign({ userId: user.id, username: user.username }, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    return jsonResponse({ token, username: user.username, userId: user.id }, 200);
  } catch (err) {
    console.error('Login error:', err);
    return jsonResponse({ error: 'Server error' }, 500);
  }
}

export async function register(request, env) {
  try {
    const { username, email, password } = await request.json();
    if (!username || !email || !password) {
      return jsonResponse({ error: 'Username, email, and password required' }, 400);
    }

    if (password.length < 8) {
      return jsonResponse({ error: 'Password must be at least 8 characters' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await env.social_app_db
      .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .bind(username, normalizedEmail)
      .first();

    if (existingUser) {
      return jsonResponse({ error: 'Username or email already exists' }, 400);
    }

    const hashedPassword = await hash(password, 10);
    const userId = crypto.randomUUID();

    await env.social_app_db
      .prepare('INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)')
      .bind(userId, username, normalizedEmail, hashedPassword)
      .run();

    const token = sign({ userId, username }, env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    return jsonResponse({ token, username, userId }, 201);
  } catch (err) {
    console.error('Register error:', err);
    return jsonResponse({ error: 'Server error' }, 500);
  }
}

// Token verification middleware (for protecting routes)
export async function verifyToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid token', status: 401 };
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verify(token, env.JWT_SECRET);
    return { payload: decoded, status: 200 };
  } catch (err) {
    return { error: 'Invalid or expired token', status: 401 };
  }
}

// Utility for consistent JSON responses with CORS
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
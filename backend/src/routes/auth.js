import { hash, compare } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { corsHeaders } from '../utils/cors';

/**
 * Handle user login.
 * 
 * @param {Request} request 
 * @param {Env} env 
 * @returns {Response}
 */
export async function login(request, env) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const user = await env.social_app_db
      .prepare('SELECT id, username, password FROM users WHERE email = ?')
      .bind(email)
      .first();
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const passwordMatch = await compare(password, user.password);
    if (!passwordMatch) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const token = sign({ userId: user.id, username: user.username }, env.JWT_SECRET, {
      expiresIn: '1d',
    });
    return new Response(JSON.stringify({ token, username: user.username }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Login error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

/**
 * Handle user registration.
 * 
 * @param {Request} request 
 * @param {Env} env 
 * @returns {Response}
 */
export async function register(request, env) {
  try {
    const { username, email, password } = await request.json();
    if (!username || !email || !password) {
      return new Response(JSON.stringify({ error: 'Username, email, and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const existingUser = await env.social_app_db
      .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .bind(username, email)
      .first();
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Username or email already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const hashedPassword = await hash(password, 10);
    const userId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await env.social_app_db
      .prepare('INSERT INTO users (id, username, email, password, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(userId, username, email, hashedPassword, createdAt)
      .run();

    const token = sign({ userId, username }, env.JWT_SECRET, { expiresIn: '1d' });
    return new Response(JSON.stringify({ token, username }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('Register error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
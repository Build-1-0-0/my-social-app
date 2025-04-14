import { hashPassword, comparePassword, verifyToken } from '../utils/auth';
import { corsHeaders } from '../utils/cors';

export function registerAuthRoutes(router) {
  router.post('/api/users/register', async ({ request, env }) => {
    try {
      const { username, email, password } = await request.json();
      if (!username || !email || !password) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (password.length < 6) {
        return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return new Response(JSON.stringify({ error: 'Username must be 3-20 characters (letters, numbers, underscores)' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return new Response(JSON.stringify({ error: 'Invalid email format' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const existingUser = await env.DB.prepare('SELECT username FROM users WHERE username = ? OR email = ?')
        .bind(username, email)
        .first();
      if (existingUser) {
        return new Response(JSON.stringify({ error: 'Username or email already exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const hashedPassword = await hashPassword(password);
      const user = await env.DB.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?) RETURNING id')
        .bind(username, email, hashedPassword)
        .first();
      
      const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '1d' });
      return new Response(JSON.stringify({ token, username }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Register error:', error);
      return new Response(JSON.stringify({ error: 'Registration failed: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });

  router.post('/api/users/login', async ({ request, env }) => {
    try {
      const { username, password } = await request.json();
      if (!username || !password) {
        return new Response(JSON.stringify({ error: 'Missing username or password' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const user = await env.DB.prepare('SELECT id, username, password FROM users WHERE username = ?')
        .bind(username)
        .first();
      if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, { expiresIn: '1d' });
      return new Response(JSON.stringify({ token, username: user.username }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } catch (error) {
      console.error('Login error:', error);
      return new Response(JSON.stringify({ error: 'Login failed: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  });
  }

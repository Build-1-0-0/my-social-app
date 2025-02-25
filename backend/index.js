// backend/index.js (Cloudflare Worker)
import { MongoClient } from 'mongodb';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        if (path === '/') {
            return new Response('Social Media Backend is running!');
        }

        const client = new MongoClient(env.VITE_MONGODB_URI);
        let db;

        try {
            await client.connect();
            db = client.db('social_media_db');
        } catch (err) {
            console.error('MongoDB Connection Error:', err);
            return new Response(JSON.stringify({ error: 'Database connection failed' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (path === '/testmongo') {
            try {
                const collection = db.collection('testCollection');
                await collection.insertOne({ test: 'Hello from mongo!' });
                return new Response('Mongo test success!');
            } catch (err) {
                console.error('Mongo Test Error:', err);
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        if (path === '/api/data') {
            try {
                const collection = db.collection('testCollection');
                const data = await collection.find({}).toArray();
                return new Response(JSON.stringify(data), {
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (err) {
                console.error('API Data Error:', err);
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        if (path === '/api/users/register' && request.method === 'POST') {
            try {
                const { username, email, password } = await request.json();
                const collection = db.collection('users');
                const existingUser = await collection.findOne({ $or: [{ username }, { email }] });
                if (existingUser) {
                    return new Response(JSON.stringify({ error: 'Username or email already exists' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
                const result = await collection.insertOne({ username, email, password });
                return new Response(JSON.stringify({ message: 'User registered successfully', userId: result.insertedId }), {
                    status: 201,
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (err) {
                console.error('Registration Error:', err);
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        if (path === '/api/users/login' && request.method === 'POST') {
            try {
                const { username, password } = await request.json();
                const collection = db.collection('users');
                const user = await collection.findOne({ username, password });
                if (!user) {
                    return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
                return new Response(JSON.stringify({ message: 'Login successful', userId: user._id }), {
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (err) {
                console.error('Login Error:', err);
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        return new Response('Not Found', { status: 404 });
    },
};

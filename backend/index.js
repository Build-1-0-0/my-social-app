// backend/index.js
require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001; // Use environment port or 3001

app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = process.env.VITE_MONGODB_URI;

if (!uri) {
    console.error('Error: VITE_MONGODB_URI environment variable is not set.');
    process.exit(1);
}

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db; // Store the database connection

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas');
        db = client.db('social_media_db'); // Assign the database object
    } catch (err) {
        console.error('Error connecting to MongoDB Atlas:', err);
        process.exit(1);
    }
}

connectToDatabase();

// Routes
app.get('/', (req, res) => {
    res.send('Social Media Backend is running!');
});

app.get('/testmongo', async (req, res) => {
    try {
        const collection = db.collection('testCollection');
        await collection.insertOne({ test: 'Hello from mongo!' });
        res.send('Mongo test success!');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/data', async (req, res) => {
    try {
        const collection = db.collection('testCollection');
        const data = await collection.find({}).toArray();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// User Routes
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const collection = db.collection('users');
        const existingUser = await collection.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        const result = await collection.insertOne({ username, email, password }); // In prod, hash the password
        res.status(201).json({ message: 'User registered successfully', userId: result.insertedId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const collection = db.collection('users');
        const user = await collection.findOne({ username, password }); // In prod, compare hashed passwords
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        res.json({ message: 'Login successful', userId: user._id }); // In prod, generate JWT
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

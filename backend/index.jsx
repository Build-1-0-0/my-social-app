require('dotenv').config(); // Load environment variables from .env (if using locally)
const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const port = 3001;

app.use(express.json());

// MongoDB connection string from environment variable
const uri = process.env.VITE_MONGODB_URI; // Cloudflare Pages environment variable

if (!uri) {
    console.error('Error: VITE_MONGODB_URI environment variable is not set.');
    process.exit(1); // Exit if the connection string is not set
}

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas');
    } catch (err) {
        console.error('Error connecting to MongoDB Atlas:', err);
        process.exit(1); // Exit if connection fails
    }
}

connectToDatabase();

// Simple test route
app.get('/', (req, res) => {
    res.send('Social Media Backend is running!');
});

// MongoDB test route
app.get('/testmongo', async (req, res) => {
    try {
        const database = client.db('social_media_db');
        const collection = database.collection('testCollection');
        const result = await collection.insertOne({ test: 'Hello from mongo!' });
        res.send('Mongo test success!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err.message);
    }
});

// Example API endpoint (replace with your actual API logic)
app.get('/api/data', async (req, res) => {
    try {
        const database = client.db('social_media_db');
        const collection = database.collection('testCollection'); //replace with your collection.
        const data = await collection.find({}).toArray(); //get all documents.
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error: ' + err.message);
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

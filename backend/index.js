const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const port = 3001;

app.use(express.json());

// MongoDB connection string
const uri = "mongodb+srv://dbuser:password1234@cluster0.ptwvc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace with your connection string

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToDatabase() {
    try {
        await client.connect();
        console.log('Connected to MongoDB Atlas');
    } catch (err) {
        console.error('Error connecting to MongoDB Atlas:', err);
    }
}

connectToDatabase();

// Simple test route
app.get('/', (req, res) => {
    res.send('Social Media Backend is running!');
});

//MongoDB test route
app.get('/testmongo', async (req, res)=>{
    try{
        const database = client.db('social_media_db');
        const collection = database.collection('testCollection');
        const result = await collection.insertOne({test: "Hello from mongo!"});
        res.send("Mongo test success!");
    } catch (err){
        console.error(err);
        res.send("Error: " + err);
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

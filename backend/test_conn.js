const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
    console.log('Testing connection with MongoClient...');
    const uri = process.env.MONGODB_URI;
    console.log('URI:', uri.replace(/:[^:@/]+@/, ':****@')); // Hide password

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Successfully connected to MongoDB Atlas');
        const databasesList = await client.db().admin().listDatabases();
        console.log('Databases:');
        databasesList.databases.forEach(db => console.log(` - ${db.name}`));
    } catch (e) {
        console.error('Connection failed:');
        console.error(e);
    } finally {
        await client.close();
    }
}

testConnection();

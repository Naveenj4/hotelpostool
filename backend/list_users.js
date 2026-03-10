const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('--- USER LIST ---');
    users.forEach(u => {
        console.log(`Email: ${u.email}, Username: ${u.username}, Role: ${u.role}`);
    });
    console.log('-----------------');
    process.exit(0);
}
run();

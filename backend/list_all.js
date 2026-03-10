const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const rests = await mongoose.connection.db.collection('restaurants').find({}).toArray();
    console.log('--- RESTAURANT LIST ---');
    rests.forEach(r => {
        console.log(`ID: ${r._id}, Name: ${r.company_name}, Store: ${r.store_name}`);
    });
    console.log('-----------------');

    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('--- USER LIST ---');
    users.forEach(u => {
        console.log(`Email: ${u.email}, RestaurantID: ${u.restaurant_id}, Role: ${u.role}`);
    });
    console.log('-----------------');
    process.exit(0);
}
run();

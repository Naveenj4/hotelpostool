const mongoose = require('mongoose');
const User = require('./src/models/User');
const Restaurant = require('./src/models/Restaurant');
const dotenv = require('dotenv');

dotenv.config();

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({}).populate('restaurant_id');
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- Name: ${u.name}, Email: ${u.email}, Username: ${u.username}, Role: ${u.role}, Restaurant: ${u.restaurant_id ? u.restaurant_id.company_name : 'N/A'}`);
        });

        const restaurants = await Restaurant.find({});
        console.log(`Found ${restaurants.length} restaurants:`);
        restaurants.forEach(r => {
            console.log(`- Company: ${r.company_name}, Store: ${r.store_name}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkUsers();

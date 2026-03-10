const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({ email: 'admin@restoboard.com' });
    for (const user of users) {
        user.password = 'password123'; // Set plain password, let hook handle it
        await user.save();
        console.log(`Updated password for user ${user._id} to 'password123'`);
    }
    process.exit(0);
}
run();

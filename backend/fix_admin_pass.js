const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');

async function testPassword() {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: 'admin@restoboard.com' }).select('+password');
    if (!user) {
        console.log('User admin@restoboard.com not found');
        process.exit(0);
    }

    // Test password123
    const isMatch = await bcrypt.compare('password123', user.password);
    console.log(`Password match for admin@restoboard.com with 'password123': ${isMatch}`);

    // If not match, maybe try something else or just reset it
    if (!isMatch) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash('password123', salt);
        await user.save();
        console.log('Reset password for admin@restoboard.com to password123');
    }

    process.exit(0);
}
testPassword();

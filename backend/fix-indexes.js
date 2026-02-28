const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const col = db.collection('users');

    // Fix empty string fields to null
    const r1 = await col.updateMany({ username: '' }, { $set: { username: null } });
    console.log('Updated username empty to null:', r1.modifiedCount);

    const r2 = await col.updateMany({ email: '' }, { $set: { email: null } });
    console.log('Updated email empty to null:', r2.modifiedCount);

    const r3 = await col.updateMany({ mobile: '' }, { $set: { mobile: null } });
    console.log('Updated mobile empty to null:', r3.modifiedCount);

    // Ensure is_active is set for existing users
    const r4 = await col.updateMany({ is_active: { $exists: false } }, { $set: { is_active: true } });
    console.log('Set is_active on existing users:', r4.modifiedCount);

    console.log('Done! All users fixed.');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

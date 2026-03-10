const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function debugDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);
            if (count > 0) {
                const doc = await mongoose.connection.db.collection(col.name).findOne();
                console.log(`  Sample:`, JSON.stringify(doc, null, 2));
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
debugDB();

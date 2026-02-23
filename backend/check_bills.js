const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const billSchema = new mongoose.Schema({
    company_id: mongoose.Schema.Types.ObjectId,
    bill_number: String,
    status: String,
    payment_mode: String,
    payment_modes: [{
        type: String,
        amount: Number
    }],
    grand_total: Number,
    createdAt: Date
});

const Bill = mongoose.model('Bill', billSchema);

const restaurantSchema = new mongoose.Schema({
    company_name: String,
    store_name: String,
    print_name: String
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    mobile: String,
    restaurant_id: mongoose.Schema.Types.ObjectId
});

const User = mongoose.model('User', userSchema);

async function checkDatabase() {
    try {
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Checking database contents...');

        // Check users
        const users = await User.find({});
        console.log(`Found ${users.length} users`);

        if (users.length > 0) {
            console.log('\nUsers:');
            users.forEach(user => {
                console.log({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    restaurant_id: user.restaurant_id
                });
            });
        }

        // Check restaurants
        const restaurants = await Restaurant.find({});
        console.log(`\nFound ${restaurants.length} restaurants`);

        if (restaurants.length > 0) {
            console.log('\nRestaurants:');
            restaurants.forEach(restaurant => {
                console.log({
                    id: restaurant._id,
                    company_name: restaurant.company_name,
                    store_name: restaurant.store_name,
                    print_name: restaurant.print_name
                });
            });
        }

        // Check bills
        const allBills = await Bill.find({});
        console.log(`\nFound ${allBills.length} total bills`);

        if (allBills.length > 0) {
            console.log('\nAll bills:');
            allBills.forEach(bill => {
                console.log({
                    id: bill._id,
                    bill_number: bill.bill_number,
                    status: bill.status,
                    company_id: bill.company_id,
                    payment_mode: bill.payment_mode,
                    payment_modes: bill.payment_modes,
                    grand_total: bill.grand_total,
                    createdAt: bill.createdAt
                });
            });
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        mongoose.connection.close();
    }
}

checkDatabase();
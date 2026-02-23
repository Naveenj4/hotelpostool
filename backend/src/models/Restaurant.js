const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    company_name: {
        type: String,
        required: [true, 'Company name is required'],
        minlength: [3, 'Company name must be at least 3 characters'],
        trim: true
    },
    store_name: {
        type: String,
        required: [true, 'Store name is required'],
        trim: true
    },
    print_name: {
        type: String,
        required: [true, 'Print name is required'],
        trim: true
    },
    restaurant_type: {
        type: String,
        enum: ['SELF_SERVICE', 'DINING'],
        required: [true, 'Restaurant type is required']
    },
    financial_year_start: {
        type: Date,
        required: [true, 'Financial year start date is required']
    },
    financial_year_end: {
        type: Date,
        required: [true, 'Financial year end date is required']
    },
    books_from: {
        type: Date,
        required: [true, 'Books from date is required']
    },
    address: {
        type: String,
        required: [true, 'Address is required']
    },
    fssai_no: {
        type: String,
        trim: true
    },
    gstin: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Restaurant', restaurantSchema);

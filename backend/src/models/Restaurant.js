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
        enum: ['SMART', 'EFFICIENT', 'ENTERPRISE', 'SELF_SERVICE', 'DINING'],
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
    },
    billing_layout: {
        type: String,
        enum: ['SIDEBAR', 'TOP_HEADER'],
        default: 'SIDEBAR'
    },
    printer_enabled: {
        type: Boolean,
        default: false
    },
    printer_width: {
        type: String,
        default: '58mm'
    },
    bill_header: {
        type: String,
        default: ''
    },
    bill_footer: {
        type: String,
        default: ''
    },
    gst_no: {
        type: String,
        default: ''
    },
    auto_print: {
        type: Boolean,
        default: false
    },
    kot_printer_ip: { type: String, default: '' },
    bill_printer_ip: { type: String, default: '' },
    kitchen_mapping: [{
        category: String,
        printer_ip: String
    }],
    zomato_api_key: { type: String, default: '' },
    swiggy_api_key: { type: String, default: '' },
    order_integration_enabled: { type: Boolean, default: false },
    loyalty_enabled: { type: Boolean, default: false },
    loyalty_points_per_100: { type: Number, default: 1 },
    loyalty_target_points: { type: Number, default: 0 },
    loyalty_point_value: { type: Number, default: 1 },
    bill_series: {
        dine_in: { prefix: { type: String, default: 'DI' }, next_number: { type: Number, default: 1 } },
        takeaway: { prefix: { type: String, default: 'TA' }, next_number: { type: Number, default: 1 } },
        delivery: { prefix: { type: String, default: 'DE' }, next_number: { type: Number, default: 1 } },
        parcel: { prefix: { type: String, default: 'PA' }, next_number: { type: Number, default: 1 } },
        party: { prefix: { type: String, default: 'PT' }, next_number: { type: Number, default: 1 } }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Restaurant', restaurantSchema);

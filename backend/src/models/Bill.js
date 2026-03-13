const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    bill_number: {
        type: String,
        required: true
    },
    counter_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Counter'
    },
    table_no: {
        type: String,
        trim: true
    },
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    customer_name: {
        type: String,
        trim: true
    },
    customer_phone: {
        type: String,
        trim: true
    },
    persons: {
        type: Number
    },
    status: {
        type: String,
        enum: ['DRAFT', 'OPEN', 'PAID', 'CANCELLED', 'DUE', 'CREDIT'],
        default: 'OPEN'
    },
    type: {
        type: String,
        enum: ['DINE_IN', 'TAKEAWAY', 'SELF_SERVICE'],
        default: 'SELF_SERVICE'
    },
    items: [{
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unit_price: {
            type: Number,
            required: true
        },
        total_price: {
            type: Number,
            required: true
        },
        category: String // To help with splitting if needed
    }],
    sub_total: {
        type: Number,
        required: true,
        default: 0
    },
    tax_amount: {
        type: Number,
        default: 0
    },
    discount_amount: {
        type: Number,
        default: 0
    },
    delivery_charge: {
        type: Number,
        default: 0
    },
    container_charge: {
        type: Number,
        default: 0
    },
    round_off: {
        type: Number,
        default: 0
    },
    grand_total: {
        type: Number,
        required: true,
        default: 0
    },
    payment_mode: {
        type: String,
        enum: ['CASH', 'UPI', 'CARD', 'SPLIT', 'PENDING'],
        default: 'PENDING'
    },
    payment_details: {
        cash_received: Number,
        change_returned: Number,
        split_details: [{
            mode: String,
            amount: Number
        }]
    },
    payment_modes: [{
        type: {
            type: String,
            enum: ['CASH', 'UPI', 'CARD', 'ONLINE', 'SPLIT'],
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        cash_received: Number,  // For CASH payments
        balance_return: Number, // For CASH payments
        upi_reference: String   // For UPI payments
    }],
    total_paid: {
        type: Number,
        default: 0
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    cancellation_reason: String,
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index for unique bill numbers within a company
billSchema.index({ company_id: 1, bill_number: 1 }, { unique: true });

module.exports = mongoose.model('Bill', billSchema);

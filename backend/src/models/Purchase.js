const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    purchase_rate: {
        type: Number,
        required: true
    },
    gst_percent: {
        type: Number,
        default: 0
    },
    total_amount: {
        type: Number,
        required: true
    }
});

const purchaseSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    supplier_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    invoice_number: {
        type: String,
        required: true
    },
    purchase_date: {
        type: Date,
        default: Date.now
    },
    items: [purchaseItemSchema],
    sub_total: {
        type: Number,
        required: true
    },
    tax_amount: {
        type: Number,
        default: 0
    },
    other_charges: {
        type: Number,
        default: 0
    },
    grand_total: {
        type: Number,
        required: true
    },
    payment_status: {
        type: String,
        enum: ['UNPAID', 'PARTIAL', 'PAID'],
        default: 'UNPAID'
    },
    paid_amount: {
        type: Number,
        default: 0
    },
    due_amount: {
        type: Number,
        required: true
    },
    notes: String,
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Purchase', purchaseSchema);

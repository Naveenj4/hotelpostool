const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    voucher_type: {
        type: String,
        enum: ['RECEIPT', 'PAYMENT', 'CONTRA', 'JOURNAL'],
        required: true
    },
    voucher_number: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    debit_ledger: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ledger',
        required: true
    },
    credit_ledger: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ledger',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    narration: {
        type: String,
        trim: true
    },
    reference_id: {
        type: mongoose.Schema.Types.ObjectId // Can link to Purchase, Bill, etc if needed
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Voucher', voucherSchema);

const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Ledger name is required'],
        trim: true
    },
    group: {
        type: String,
        required: [true, 'Ledger group is required'],
        enum: ['SUNDRY_DEBTORS', 'SUNDRY_CREDITORS', 'CASH_IN_HAND', 'BANK_ACCOUNTS', 'INDIRECT_EXPENSES', 'DIRECT_EXPENSES', 'INDIRECT_INCOMES', 'DIRECT_INCOMES', 'SALES_ACCOUNTS', 'PURCHASE_ACCOUNTS', 'DUTIES_AND_TAXES'],
        default: 'INDIRECT_EXPENSES'
    },
    opening_balance: {
        type: Number,
        default: 0
    },
    balance_type: {
        type: String,
        enum: ['DR', 'CR'],
        default: 'DR'
    },
    description: {
        type: String,
        trim: true
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

ledgerSchema.index({ company_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Ledger', ledgerSchema);

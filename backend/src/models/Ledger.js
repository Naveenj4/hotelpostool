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
    // 1. Party Details
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    gstin: { type: String, trim: true },
    pan_number: { type: String, trim: true },
    party_type: { type: String, enum: ['CUSTOMER', 'SUPPLIER', 'AGENT', 'NONE'], default: 'NONE' },
    party_category: { type: String, trim: true },
    
    // 2. Address
    billing_address: { type: String, trim: true },
    shipping_address: { type: String, trim: true },
    same_as_billing: { type: Boolean, default: true },

    // 3. Accounts Details
    opening_balance: {
        type: Number,
        default: 0
    },
    balance_type: {
        type: String,
        enum: ['DR', 'CR'], // DR = To Collect, CR = To Pay
        default: 'DR'
    },
    due_days: { type: Number, default: 0 },
    credit_limit: { type: Number, default: 0 },

    // 4. Contact Information
    contact_person: { type: String, trim: true },
    dob: { type: Date },

    // 5. Party Bank Details
    bank_account_number: { type: String, trim: true },
    ifsc_code: { type: String, trim: true },
    bank_name: { type: String, trim: true },
    branch: { type: String, trim: true },
    account_holder_name: { type: String, trim: true },
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

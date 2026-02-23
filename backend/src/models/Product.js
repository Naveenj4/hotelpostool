const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    category: { // Using String for Phase 1 simplicity as Category model isn't defined yet
        type: String,
        required: [true, 'Category is required'],
        trim: true
    },
    product_type: {
        type: String,
        enum: ['TYPE_A', 'TYPE_B'],
        required: true
    },
    selling_price: {
        type: Number,
        required: [true, 'Selling price is required'],
        min: 0
    },
    // Fields for TYPE_A (Stock Managed)
    purchase_price: {
        type: Number,
        min: 0,
        required: function () { return this.product_type === 'TYPE_A'; }
    },
    opening_stock: {
        type: Number,
        min: 0,
        default: 0,
        required: function () { return this.product_type === 'TYPE_A'; }
    },
    current_stock: {
        type: Number,
        min: 0,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index to ensure unique product names within a company
productSchema.index({ company_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);

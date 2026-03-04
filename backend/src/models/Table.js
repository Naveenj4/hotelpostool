const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    table_number: {
        type: String,
        required: [true, 'Table number/name is required'],
        trim: true
    },
    seating_capacity: {
        type: Number,
        default: 4
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'],
        default: 'AVAILABLE'
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

tableSchema.index({ company_id: 1, table_number: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);

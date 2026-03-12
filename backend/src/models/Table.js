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
    captain: {
        type: String,
        trim: true
    },
    waiter: {
        type: String,
        trim: true
    },
    table_type: {
        type: String,
        default: 'G Floor'
    },
    status: {
        type: String,
        enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'],
        default: 'AVAILABLE'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    // Reservation details
    reservation_name: { type: String, trim: true },
    reservation_phone: { type: String, trim: true },
    reservation_time: { type: String, trim: true },
    reservation_note: { type: String, trim: true }
}, {
    timestamps: true
});

tableSchema.index({ company_id: 1, table_number: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);

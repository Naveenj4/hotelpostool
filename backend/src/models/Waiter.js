const mongoose = require('mongoose');

const waiterSchema = new mongoose.Schema({
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Waiter name is required'],
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Waiter', waiterSchema);

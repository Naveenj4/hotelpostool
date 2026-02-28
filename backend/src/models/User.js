const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
        default: null
    },
    username: {
        type: String,
        trim: true,
        lowercase: true,
        default: null
    },
    mobile: {
        type: String,
        required: false,
        trim: true,
        default: null
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false
    },
    role: {
        type: String,
        default: 'OWNER'
    },
    restaurant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    custom_role_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
        default: null
    },
    is_active: {
        type: Boolean,
        default: true
    },
    security_control_enabled: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Allow same email/mobile for different companies, but keep it unique within one company
userSchema.index({ email: 1, restaurant_id: 1 }, { unique: true, sparse: true });
userSchema.index({ mobile: 1, restaurant_id: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1, restaurant_id: 1 }, { unique: true, sparse: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

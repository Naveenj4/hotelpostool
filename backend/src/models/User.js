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
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        validate: {
            validator: function (v) {
                return /\d/.test(v); // At least one number
            },
            message: props => 'Password must contain at least one number'
        },
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
    security_control_enabled: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Allow same email/mobile for different companies, but keep it unique within one company
userSchema.index({ email: 1, restaurant_id: 1 }, { unique: true });
userSchema.index({ mobile: 1, restaurant_id: 1 }, { unique: true });

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

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const path = require('path');

// Trust proxy (required for Render/reverse proxies)
app.set('trust proxy', 1);

// Static folders
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/suppliers', require('./routes/supplierRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/table-types', require('./routes/tableTypeRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/captains', require('./routes/captainRoutes'));
app.use('/api/waiters', require('./routes/waiterRoutes'));
app.use('/api/ledgers', require('./routes/ledgerRoutes'));
app.use('/api/kitchens', require('./routes/kitchenRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/vouchers', require('./routes/voucherRoutes'));
app.use('/api/counters', require('./routes/counterRoutes'));
app.use('/api/bills', require('./routes/billRoutes'));
app.use('/api/stock', require('./routes/stockRoutes'));
app.use('/api/reports', require('./routes/reportsRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/receipts', require('./routes/receiptRoutes'));

// Basic health check
app.get('/', (req, res) => {
    res.send('API is running...');
});

const { errorHandler } = require('./middleware/errorMiddleware');

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

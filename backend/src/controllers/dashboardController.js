const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Product = require('../models/Product');

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private (Admin, Billing)
exports.getDashboardSummary = async (req, res) => {
    try {
        const hotelId = req.user.restaurant_id._id || req.user.restaurant_id; // Get the ObjectId

        // Get today's date for calculating today's sales
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch today's PAID bills
        const todayBillsPromise = Bill.find({
            company_id: hotelId,
            createdAt: { $gte: today, $lt: tomorrow },
            status: 'PAID'
        });

        // Get top selling products for today only (aggregate bill items by product)
        const topProductsPromise = Bill.aggregate([
            {
                $match: {
                    company_id: new mongoose.Types.ObjectId(hotelId),
                    createdAt: { $gte: today, $lt: tomorrow },
                    status: 'PAID'
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product_id",
                    name: { $first: "$items.name" },
                    quantity: { $sum: "$items.quantity" },
                    sales: { $sum: "$items.total_price" }
                }
            },
            { $sort: { quantity: -1 } },
            { $limit: 5 }
        ]);

        // Get low stock items (products with current_stock < 10)
        const lowStockItemsPromise = Product.find({
            company_id: hotelId,
            current_stock: { $lt: 10 },
            is_active: true
        });

        // Get today's purchases
        const Purchase = require('../models/Purchase');
        const todayPurchasesPromise = Purchase.find({ company_id: hotelId, createdAt: { $gte: today, $lt: tomorrow } });

        // Get total outstanding balances
        const Supplier = require('../models/Supplier');
        const Customer = require('../models/Customer');
        const supplierOutstandingPromise = Supplier.aggregate([{ $match: { company_id: new mongoose.Types.ObjectId(hotelId) } }, { $group: { _id: null, total: { $sum: "$opening_balance" } } }]);
        const customerOutstandingPromise = Customer.aggregate([{ $match: { company_id: new mongoose.Types.ObjectId(hotelId) } }, { $group: { _id: null, total: { $sum: "$opening_balance" } } }]);

        // Latest 5 Vouchers
        const Voucher = require('../models/Voucher');
        const latestVouchersPromise = Voucher.find({ company_id: hotelId }).sort({ createdAt: -1 }).limit(5).populate('debit_ledger', 'name').populate('credit_ledger', 'name');

        // Wait for all promises to resolve
        const [todayBills, topProductsResult, lowStockItems, todayPurchases, supplierOut, customerOut, latestVouchers] = await Promise.all([
            todayBillsPromise,
            topProductsPromise,
            lowStockItemsPromise,
            todayPurchasesPromise,
            supplierOutstandingPromise,
            customerOutstandingPromise,
            latestVouchersPromise
        ]);

        // Calculate today's sales and purchases
        const todaySales = todayBills.reduce((sum, bill) => sum + (bill.grand_total || 0), 0);
        const todayPurchasesTotal = todayPurchases.reduce((sum, p) => sum + (p.grand_total || 0), 0);
        const totalBills = todayBills.length;

        // ... (existing paymentSummary logic) ...
        let paymentSummary = {};
        todayBills.forEach(bill => {
            if (bill.payment_modes && bill.payment_modes.length > 0) {
                bill.payment_modes.forEach(payment => {
                    if (!paymentSummary[payment.type]) paymentSummary[payment.type] = 0;
                    paymentSummary[payment.type] += payment.amount;
                });
            }
        });

        const summary = {
            todaySales,
            todayPurchases: todayPurchasesTotal,
            totalBills,
            supplierOutstanding: supplierOut[0]?.total || 0,
            customerOutstanding: customerOut[0]?.total || 0,
            paymentSummary: Object.keys(paymentSummary).map(mode => ({ mode, amount: paymentSummary[mode] })),
            topProducts: topProductsResult.map(item => ({ name: item.name, quantity: item.quantity, sales: item.sales })),
            lowStockItems: lowStockItems.map(p => ({ item: p.name, remaining: p.current_stock, unit: 'units' })),
            latestVouchers: latestVouchers.map(v => ({ date: v.date, type: v.voucher_type, amount: v.amount, dr: v.debit_ledger?.name, cr: v.credit_ledger?.name })),
            restaurantInfo: { printName: req.user.restaurant_id?.print_name || req.user.restaurant_id?.company_name || 'Restaurant' }
        };

        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        console.error('Dashboard summary error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

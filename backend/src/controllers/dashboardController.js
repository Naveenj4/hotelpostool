const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Product = require('../models/Product');

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private (Admin, Billing)
exports.getDashboardSummary = async (req, res) => {
    try {
        const hotelId = req.user.restaurant_id; // Using the hotelId from the authenticated user

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
                    company_id: hotelId,
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

        // Wait for all promises to resolve
        const [todayBills, topProductsResult, lowStockItems] = await Promise.all([
            todayBillsPromise,
            topProductsPromise,
            lowStockItemsPromise
        ]);

        // Calculate today's sales using grand_total (same as reports controller)
        const todaySales = todayBills.reduce((sum, bill) => sum + (bill.grand_total || 0), 0);
        const totalBills = todayBills.length;

        // Payment mode breakdown for today
        let paymentSummary = {};
        todayBills.forEach(bill => {
            if (bill.payment_modes && bill.payment_modes.length > 0) {
                bill.payment_modes.forEach(payment => {
                    if (!paymentSummary[payment.type]) {
                        paymentSummary[payment.type] = 0;
                    }
                    paymentSummary[payment.type] += payment.amount;
                });
            }
        });

        const paymentSummaryResult = Object.keys(paymentSummary).map(mode => ({
            mode,
            amount: paymentSummary[mode]
        }));

        // Format low stock alerts to match expected structure
        const lowStockAlerts = lowStockItems.map(product => ({
            item: product.name,
            remaining: product.current_stock,
            unit: 'units' // Assuming units, could be enhanced to include unit type from product if available
        }));

        // Format top products to match expected structure
        const topProducts = topProductsResult.map(item => ({
            name: item.name,
            quantity: item.quantity,
            sales: item.sales
        }));

        // Format payment summary to match reports format
        paymentSummary = paymentSummaryResult;

        const summary = {
            todaySales: todaySales,
            totalBills: totalBills,
            paymentSummary: paymentSummary,
            topProducts: topProducts,
            lowStockItems: lowStockAlerts,
            restaurantInfo: {
                printName: req.user.restaurant_id.print_name || req.user.restaurant_id.company_name
            }
        };

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Dashboard summary error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

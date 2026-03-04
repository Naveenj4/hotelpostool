const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Ledger = require('../models/Ledger');
const Purchase = require('../models/Purchase');

// @desc    Get daily/range sales report
// @route   GET /api/reports/daily?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Admin, Owner)
exports.getDailyReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Parse dates or use today as default
        let start = new Date();
        let end = new Date();

        if (startDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
        } else {
            start.setHours(0, 0, 0, 0);
        }

        if (endDate) {
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            end.setHours(23, 59, 59, 999);
        }

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        }).sort({ createdAt: 1 });

        // Calculate metrics for the entire period
        const totalSales = bills.reduce((sum, bill) => sum + bill.grand_total, 0);
        const totalBills = bills.length;
        const cancelledBills = await Bill.countDocuments({
            company_id: req.user.restaurant_id,
            status: 'CANCELLED',
            createdAt: { $gte: start, $lte: end }
        });

        // Payment mode breakdown
        const paymentSummary = {};
        bills.forEach(bill => {
            if (bill.payment_modes && bill.payment_modes.length > 0) {
                bill.payment_modes.forEach(payment => {
                    if (!paymentSummary[payment.type]) {
                        paymentSummary[payment.type] = 0;
                    }
                    paymentSummary[payment.type] += payment.amount;
                });
            }
        });

        const paymentModes = Object.keys(paymentSummary).map(mode => ({
            mode,
            amount: paymentSummary[mode]
        }));

        res.status(200).json({
            success: true,
            data: {
                period: {
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0]
                },
                totalSales,
                totalBills,
                cancelledBills,
                paymentSummary: paymentModes
            }
        });
    } catch (error) {
        console.error('Daily report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get weekly sales report with daily breakdown
// @route   GET /api/reports/weekly?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Admin, Owner)
exports.getWeeklyReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let start, end;

        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            // Default to last 7 days
            start = new Date();
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            end = new Date();
            end.setHours(23, 59, 59, 999);
        }

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        }).sort({ createdAt: 1 });

        // Group by day
        const dailySales = {};
        const currentDate = new Date(start);

        // Initialize all dates in range
        while (currentDate <= end) {
            const dateKey = currentDate.toISOString().split('T')[0];
            dailySales[dateKey] = {
                date: dateKey,
                totalSales: 0,
                billCount: 0
            };
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Populate with actual data
        bills.forEach(bill => {
            const dateKey = bill.createdAt.toISOString().split('T')[0];
            if (dailySales[dateKey]) {
                dailySales[dateKey].totalSales += bill.grand_total;
                dailySales[dateKey].billCount += 1;
            }
        });

        const salesData = Object.values(dailySales);

        res.status(200).json({
            success: true,
            data: {
                period: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] },
                totalSales: salesData.reduce((sum, day) => sum + day.totalSales, 0),
                totalBills: salesData.reduce((sum, day) => sum + day.billCount, 0),
                dailyBreakdown: salesData
            }
        });
    } catch (error) {
        console.error('Weekly report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get monthly sales report
// @route   GET /api/reports/monthly?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Admin, Owner)
exports.getMonthlyReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let start, end;

        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            // Default to current month
            const today = new Date();
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        }

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        }).sort({ createdAt: 1 });

        // Group by week
        const weeks = {};
        bills.forEach(bill => {
            const weekNumber = Math.ceil(bill.createdAt.getDate() / 7);
            if (!weeks[weekNumber]) {
                weeks[weekNumber] = {
                    week: weekNumber,
                    totalSales: 0,
                    billCount: 0
                };
            }
            weeks[weekNumber].totalSales += bill.grand_total;
            weeks[weekNumber].billCount += 1;
        });

        res.status(200).json({
            success: true,
            data: {
                period: {
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0]
                },
                totalSales: bills.reduce((sum, bill) => sum + bill.grand_total, 0),
                totalBills: bills.length,
                weeklyBreakdown: Object.values(weeks)
            }
        });
    } catch (error) {
        console.error('Monthly report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get sales by category
// @route   GET /api/reports/sales-by-category?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Admin, Owner)
exports.getSalesByCategory = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let start, end;

        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            // Default to last 30 days
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        });

        // Aggregate by category
        const categorySales = {};
        bills.forEach(bill => {
            bill.items.forEach(item => {
                if (item.category) {
                    if (!categorySales[item.category]) {
                        categorySales[item.category] = {
                            category: item.category,
                            totalSales: 0,
                            itemCount: 0
                        };
                    }
                    categorySales[item.category].totalSales += item.total_price;
                    categorySales[item.category].itemCount += item.quantity;
                }
            });
        });

        const sortedCategories = Object.values(categorySales)
            .sort((a, b) => b.totalSales - a.totalSales);

        res.status(200).json({
            success: true,
            data: sortedCategories
        });
    } catch (error) {
        console.error('Sales by category error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get top selling products
// @route   GET /api/reports/top-products?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=10
// @access  Private (Admin, Owner)
exports.getTopProducts = async (req, res) => {
    try {
        const { limit = 10, startDate, endDate } = req.query;

        let start, end;

        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            // Default to last 30 days
            end = new Date();
            end.setHours(23, 59, 59, 999);
            start = new Date();
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
        }

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        });

        // Aggregate product sales
        const productSales = {};
        bills.forEach(bill => {
            bill.items.forEach(item => {
                if (!productSales[item.product_id]) {
                    productSales[item.product_id] = {
                        productId: item.product_id,
                        name: item.name,
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[item.product_id].quantity += item.quantity;
                productSales[item.product_id].revenue += item.total_price;
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, parseInt(limit));

        res.status(200).json({
            success: true,
            data: topProducts
        });
    } catch (error) {
        console.error('Top products error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get supplier outstanding balances
// @route   GET /api/reports/supplier-outstanding
exports.getSupplierOutstanding = async (req, res) => {
    try {
        const suppliers = await Supplier.find({ company_id: req.user.restaurant_id });
        const outstanding = suppliers.map(s => ({
            name: s.name,
            contact: s.contact_person,
            balance: s.opening_balance // Using opening_balance as the living balance field
        })).filter(s => s.balance > 0).sort((a, b) => b.balance - a.balance);

        res.status(200).json({ success: true, data: outstanding });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get customer outstanding balances
// @route   GET /api/reports/customer-outstanding
exports.getCustomerOutstanding = async (req, res) => {
    try {
        const customers = await Customer.find({ company_id: req.user.restaurant_id });
        const outstanding = customers.map(c => ({
            name: c.name,
            phone: c.phone,
            balance: c.opening_balance
        })).filter(c => c.balance > 0).sort((a, b) => b.balance - a.balance);

        res.status(200).json({ success: true, data: outstanding });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get stock valuation report
// @route   GET /api/reports/stock-valuation
exports.getStockValuation = async (req, res) => {
    try {
        const products = await Product.find({ company_id: req.user.restaurant_id, current_stock: { $gt: 0 } });
        const valuation = products.map(p => ({
            name: p.name,
            stock: p.current_stock,
            purchase_price: p.purchase_price || 0,
            value: (p.current_stock * (p.purchase_price || 0))
        })).sort((a, b) => b.value - a.value);

        const totalValue = valuation.reduce((sum, item) => sum + item.value, 0);

        res.status(200).json({ success: true, data: { items: valuation, totalValue } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get basic Profit & Loss report
// @route   GET /api/reports/profit-loss
exports.getProfitLoss = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
        let end = new Date(endDate || new Date());

        // 1. Total Sales (Revenue)
        const bills = await Bill.find({ company_id: req.user.restaurant_id, status: 'PAID', createdAt: { $gte: start, $lte: end } });
        const totalRevenue = bills.reduce((sum, b) => sum + b.grand_total, 0);

        // 2. Total Purchases (Cost of Goods Sold - Approx)
        const purchases = await Purchase.find({ company_id: req.user.restaurant_id, purchase_date: { $gte: start, $lte: end } });
        const totalPurchases = purchases.reduce((sum, p) => sum + p.grand_total, 0);

        // 3. Operating Expenses (From Vouchers)
        const Voucher = require('../models/Voucher');
        const vouchers = await Voucher.find({ company_id: req.user.restaurant_id, voucher_type: 'PAYMENT', date: { $gte: start, $lte: end } });
        const totalExpenses = vouchers.reduce((sum, v) => sum + v.amount, 0);

        res.status(200).json({
            success: true,
            data: {
                revenue: totalRevenue,
                purchases: totalPurchases,
                expenses: totalExpenses,
                netProfit: totalRevenue - (totalPurchases + totalExpenses)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
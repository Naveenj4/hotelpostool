const Bill = require('../models/Bill');
const Product = require('../models/Product');

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
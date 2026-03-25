const mongoose = require('mongoose');
const Bill = require('../models/Bill');
const Product = require('../models/Product');
const Purchase = require('../models/Purchase');
const Ledger = require('../models/Ledger');
const Voucher = require('../models/Voucher');

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Private (Admin, Billing)
exports.getDashboardSummary = async (req, res) => {
    try {
        const hotelId = req.user.restaurant_id._id || req.user.restaurant_id;

        const { startDate, endDate } = req.query;

        // Determine date range for "today" or selected period
        let start = new Date();
        start.setHours(0, 0, 0, 0);
        let end = new Date(start);
        end.setDate(end.getDate() + 1);

        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        }

        // Today Dates Filter
        const periodFilter = {
            company_id: new mongoose.Types.ObjectId(hotelId),
            createdAt: { $gte: start, $lt: end },
            status: 'PAID'
        };

        const purchasePeriodFilter = {
             company_id: new mongoose.Types.ObjectId(hotelId),
             purchase_date: { $gte: start, $lt: end },
             is_deleted: false
        };

        // 1. SALES
        const periodSalesPromise = Bill.aggregate([
            { $match: periodFilter },
            { $group: { _id: null, total: { $sum: "$grand_total" }, count: { $sum: 1 } } }
        ]);

        const totalSalesPromise = Bill.aggregate([
            { $match: { company_id: new mongoose.Types.ObjectId(hotelId), status: 'PAID' } },
            { $group: { _id: null, total: { $sum: "$grand_total" } } }
        ]);

        // Returns (Cancelled Bills for Demo)
        const periodReturnPromise = Bill.aggregate([
            { $match: { company_id: new mongoose.Types.ObjectId(hotelId), createdAt: { $gte: start, $lt: end }, status: 'CANCELLED' } },
            { $group: { _id: null, total: { $sum: "$grand_total" } } }
        ]);

        // 2. PURCHASES
        const periodPurchasesPromise = Purchase.aggregate([
            { $match: purchasePeriodFilter },
            { $group: { _id: null, total: { $sum: "$grand_total" } } }
        ]);

        const totalPurchasesPromise = Purchase.aggregate([
             { $match: { company_id: new mongoose.Types.ObjectId(hotelId), is_deleted: false } },
             { $group: { _id: null, total: { $sum: "$grand_total" } } }
        ]);

        // Returns (Purchase Returns logic missing in schema, default to 0)

        // 3. PAYMENTS & VOUCHERS
        const voucherPeriodFilter = {
            company_id: new mongoose.Types.ObjectId(hotelId),
            date: { $gte: start, $lt: end },
            is_deleted: false
        };

        const periodReceiptsPromise = Voucher.aggregate([
            { $match: { ...voucherPeriodFilter, voucher_type: 'RECEIPT' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const periodPaymentsPromise = Voucher.aggregate([
            { $match: { ...voucherPeriodFilter, voucher_type: 'PAYMENT' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        // CASH & BANK BALANCES
        const ledgersPromise = Ledger.find({ company_id: hotelId });

        // OUTSTANDING (Receivable / Payable)
        // Receivable = Sundry Debtors
        // Payable = Sundry Creditors

        // AGGREGATE DAILY DATA FOR GRAPHS
        const dailySalesPromise = Bill.aggregate([
            { $match: periodFilter },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                total: { $sum: "$grand_total" }
            }},
            { $sort: { _id: 1 } }
        ]);

        const dailyReceiptsPromise = Voucher.aggregate([
            { $match: { ...voucherPeriodFilter, voucher_type: 'RECEIPT' } },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                total: { $sum: "$amount" }
            }},
            { $sort: { _id: 1 } }
        ]);

        const dailyPaymentsPromise = Voucher.aggregate([
            { $match: { ...voucherPeriodFilter, voucher_type: 'PAYMENT' } },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                total: { $sum: "$amount" }
            }},
            { $sort: { _id: 1 } }
        ]);

        const [
            periodSales, totalSales, periodReturn,
            periodPurchases, totalPurchases,
            periodReceipts, periodPayments,
            ledgers,
            dailySales, dailyReceipts, dailyPayments
        ] = await Promise.all([
            periodSalesPromise, totalSalesPromise, periodReturnPromise,
            periodPurchasesPromise, totalPurchasesPromise,
            periodReceiptsPromise, periodPaymentsPromise,
            ledgersPromise,
            dailySalesPromise, dailyReceiptsPromise, dailyPaymentsPromise
        ]);

        const sumCash = ledgers.filter(l => l.group === 'Cash-in-Hand').reduce((acc, l) => acc + (l.opening_balance || 0), 0);
        const sumBank = ledgers.filter(l => l.group === 'Bank Accounts').reduce((acc, l) => acc + (l.opening_balance || 0), 0);
        
        const receivableAmount = ledgers.filter(l => l.group === 'Sundry Debtors').reduce((acc, l) => acc + (l.opening_balance || 0), 0);
        const payableAmount = ledgers.filter(l => l.group === 'Sundry Creditors').reduce((acc, l) => acc + (l.opening_balance || 0), 0);

        // Normalize graph dates
        const graphLabelsMap = new Set();
        dailySales.forEach(d => graphLabelsMap.add(d._id));
        dailyReceipts.forEach(d => graphLabelsMap.add(d._id));
        dailyPayments.forEach(d => graphLabelsMap.add(d._id));
        
        let graphLabels = Array.from(graphLabelsMap).sort();
        if (graphLabels.length === 0) {
            graphLabels = [start.toISOString().split('T')[0]]; // Default single point
        }

        const chartData = {
            labels: graphLabels,
            sales: graphLabels.map(l => dailySales.find(d => d._id === l)?.total || 0),
            receipts: graphLabels.map(l => dailyReceipts.find(d => d._id === l)?.total || 0),
            payments: graphLabels.map(l => dailyPayments.find(d => d._id === l)?.total || 0),
        };

        const summary = {
            todaySales: periodSales[0]?.total || 0,
            totalBills: periodSales[0]?.count || 0,
            todayReturns: periodReturn[0]?.total || 0,
            totalSales: totalSales[0]?.total || 0,

            todayPurchases: periodPurchases[0]?.total || 0,
            todayPurchaseReturns: 0, // Placeholder
            totalPurchases: totalPurchases[0]?.total || 0,

            todayPaymentIn: periodReceipts[0]?.total || 0,
            todayPaymentOut: periodPayments[0]?.total || 0,

            todayCashBalance: sumCash,
            todayBankBalance: sumBank,
            totalCashBank: sumCash + sumBank,

            receivableAmount: receivableAmount,
            payableAmount: payableAmount,

            chartData: chartData,

            restaurantInfo: { printName: req.user.restaurant_id?.print_name || req.user.restaurant_id?.company_name || 'Restaurant' }
        };

        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        console.error('Dashboard summary error:', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

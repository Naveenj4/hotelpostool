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

        const Category = require('../models/Category');
        const categories = await Category.find({ company_id: req.user.restaurant_id });
        const categoryMap = {};
        categories.forEach(c => categoryMap[c._id.toString()] = c.name);

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        });

        // Aggregate by category
        const categorySales = {};
        bills.forEach(bill => {
            bill.items.forEach(item => {
                const catStr = item.category ? item.category.toString() : '';
                const catName = categoryMap[catStr] || catStr || 'Uncategorized';

                if (!categorySales[catName]) {
                    categorySales[catName] = {
                        category: catName,
                        totalSales: 0,
                        itemCount: 0
                    };
                }
                categorySales[catName].totalSales += item.total_price;
                categorySales[catName].itemCount += item.quantity;
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
        const ledgers = await Ledger.find({ 
            company_id: req.user.restaurant_id, 
            group: 'SUNDRY_CREDITORS' 
        });
        const outstanding = ledgers.map(l => ({
            name: l.name,
            contact: l.contact_person,
            balance: l.opening_balance, // In a real system, compute current balance
            ledger_id: l._id
        })).filter(l => l.balance > 0).sort((a, b) => b.balance - a.balance);

        res.status(200).json({ success: true, data: outstanding });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get customer outstanding balances
// @route   GET /api/reports/customer-outstanding
exports.getCustomerOutstanding = async (req, res) => {
    try {
        const ledgers = await Ledger.find({ 
            company_id: req.user.restaurant_id, 
            group: 'SUNDRY_DEBTORS' 
        });
        const outstanding = ledgers.map(l => ({
            name: l.name,
            phone: l.phone,
            balance: l.opening_balance,
            ledger_id: l._id
        })).filter(l => l.balance > 0).sort((a, b) => b.balance - a.balance);

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

// @desc    Get sales by brand
exports.getSalesByBrand = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
        let end = new Date(endDate || new Date());
        end.setHours(23, 59, 59, 999);

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        });

        const brandSales = {};
        bills.forEach(bill => {
            bill.items.forEach(item => {
                const brand = item.brand || 'No Brand';
                if (!brandSales[brand]) brandSales[brand] = { brand, amount: 0, qty: 0 };
                brandSales[brand].amount += item.total_price;
                brandSales[brand].qty += item.quantity;
            });
        });

        res.status(200).json({ success: true, data: Object.values(brandSales).sort((a, b) => b.amount - a.amount) });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Get sales by captain
exports.getSalesByCaptain = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
        let end = new Date(endDate || new Date());
        end.setHours(23, 59, 59, 999);

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        });

        const captainSales = {};
        bills.forEach(bill => {
            const captain = bill.captain_name || 'Direct / Walk-in';
            if (!captainSales[captain]) captainSales[captain] = { captain, amount: 0, count: 0 };
            captainSales[captain].amount += bill.grand_total;
            captainSales[captain].count += 1;
        });

        res.status(200).json({ success: true, data: Object.values(captainSales).sort((a, b) => b.amount - a.amount) });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Get purchase summary (Grouped by various filters)
exports.getPurchaseSummary = async (req, res) => {
    try {
        const { startDate, endDate, groupBy = 'SUPPLIER' } = req.query;
        let start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
        let end = new Date(endDate || new Date());
        end.setHours(23, 59, 59, 999);

        const purchases = await Purchase.find({
            company_id: req.user.restaurant_id,
            purchase_date: { $gte: start, $lte: end }
        }).populate('supplier_id', 'name');

        const summary = {};
        purchases.forEach(p => {
            if (groupBy === 'SUPPLIER') {
                const name = p.supplier_id?.name || 'Unknown';
                if (!summary[name]) summary[name] = { name, amount: 0, paid: 0, due: 0 };
                summary[name].amount += p.grand_total;
                summary[name].paid += p.paid_amount;
                summary[name].due += p.due_amount;
            } else if (groupBy === 'ITEM') {
                p.items.forEach(item => {
                    const name = item.product_id; // Need proper name if possible, or just ID
                    if (!summary[name]) summary[name] = { name, qty: 0, amount: 0 };
                    summary[name].qty += item.quantity;
                    summary[name].amount += item.total_amount;
                });
            }
        });

        res.status(200).json({ success: true, data: Object.values(summary).sort((a, b) => b.amount - a.amount) });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Get Daybook (All transactions for a specific day)
exports.getDaybook = async (req, res) => {
    try {
        const { date } = req.query;
        let start = new Date(date || new Date());
        start.setHours(0, 0, 0, 0);
        let end = new Date(date || new Date());
        end.setHours(23, 59, 59, 999);

        const [bills, purchases, vouchers] = await Promise.all([
            Bill.find({ company_id: req.user.restaurant_id, status: 'PAID', createdAt: { $gte: start, $lte: end } }),
            Purchase.find({ company_id: req.user.restaurant_id, purchase_date: { $gte: start, $lte: end } }).populate('supplier_id', 'name'),
            require('../models/Voucher').find({ company_id: req.user.restaurant_id, date: { $gte: start, $lte: end } }).populate('debit_ledger credit_ledger', 'name')
        ]);

        const transactions = [
            ...bills.map(b => ({ time: b.createdAt, type: 'SALE', ref: b.bill_number, desc: `Sales Bill`, amount: b.grand_total, side: 'IN' })),
            ...purchases.map(p => ({ time: p.purchase_date, type: 'PURCHASE', ref: p.invoice_number, desc: `Purchase from ${p.supplier_id?.name}`, amount: p.grand_total, side: 'OUT' })),
            ...vouchers.map(v => ({ time: v.date, type: v.voucher_type, ref: v.voucher_number, desc: `${v.debit_ledger?.name} / ${v.credit_ledger?.name}`, amount: v.amount, side: v.voucher_type === 'RECEIPT' ? 'IN' : (v.voucher_type === 'PAYMENT' ? 'OUT' : 'TRANS') }))
        ].sort((a, b) => new Date(a.time) - new Date(b.time));

        res.status(200).json({ success: true, data: transactions });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Get Ledger Statement
exports.getLedgerStatement = async (req, res) => {
    try {
        const { ledgerId, startDate, endDate } = req.query;
        if (!ledgerId) return res.status(400).json({ success: false, error: 'Ledger ID required' });

        let start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
        start.setHours(0, 0, 0, 0);
        let end = new Date(endDate || new Date());
        end.setHours(23, 59, 59, 999);

        const Voucher = require('../models/Voucher');
        const transactions = await Voucher.find({
            company_id: req.user.restaurant_id,
            $or: [{ debit_ledger: ledgerId }, { credit_ledger: ledgerId }],
            date: { $gte: start, $lte: end }
        }).populate('debit_ledger credit_ledger', 'name').sort({ date: 1 });

        const ledger = await Ledger.findById(ledgerId);

        let runningBalance = ledger.opening_balance;
        const statement = transactions.map(t => {
            const isDebit = t.debit_ledger?._id.toString() === ledgerId;
            const dr = isDebit ? t.amount : 0;
            const cr = isDebit ? 0 : t.amount;
            runningBalance += (dr - cr);
            return {
                date: t.date,
                voucher_no: t.voucher_number,
                type: t.voucher_type,
                particulars: isDebit ? `To ${t.credit_ledger?.name}` : `By ${t.debit_ledger?.name}`,
                debit: dr,
                credit: cr,
                balance: runningBalance
            };
        });

        res.status(200).json({ success: true, ledger: ledger.name, opening_balance: ledger.opening_balance, data: statement });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Get Aging Report
exports.getAgingReport = async (req, res) => {
    try {
        const { type = 'SUPPLIER' } = req.query;
        const now = new Date();
        const ranges = {
            '0-30': 0,
            '30-60': 0,
            '60+': 0
        };

        const detailedList = [];

        if (type === 'SUPPLIER') {
            const purchases = await Purchase.find({ company_id: req.user.restaurant_id, due_amount: { $gt: 0 } }).populate('supplier_id', 'name contact_person');
            
            // Map supplier names to ledger IDs
            const ledgerMapping = await Ledger.find({ 
                company_id: req.user.restaurant_id, 
                group: 'SUNDRY_CREDITORS' 
            }).select('name _id');
            const ledgerMap = {};
            ledgerMapping.forEach(l => {
                // Try to match name normalized
                const baseName = l.name.replace(' (Supplier)', '');
                ledgerMap[baseName] = l._id;
            });

            purchases.forEach(p => {
                const diffDays = Math.ceil((now - new Date(p.purchase_date)) / (1000 * 60 * 60 * 24));
                let agingCategory = '';

                if (diffDays <= 30) { ranges['0-30'] += p.due_amount; agingCategory = '0-30'; }
                else if (diffDays <= 60) { ranges['30-60'] += p.due_amount; agingCategory = '30-60'; }
                else { ranges['60+'] += p.due_amount; agingCategory = '60+'; }

                const entityName = p.supplier_id?.name || 'Unknown Supplier';
                detailedList.push({
                    type: 'PURCHASE',
                    id: p._id,
                    reference: p.invoice_number || `PUR-${p._id.toString().slice(-6)}`,
                    entity: entityName,
                    ledger_id: ledgerMap[entityName] || null,
                    date: p.purchase_date,
                    amount: p.due_amount,
                    age: diffDays,
                    category: agingCategory
                });
            });
        } else {
            // Customers
            const bills = await Bill.find({ company_id: req.user.restaurant_id, status: 'DUE' }).populate('customer_id', 'name phone');
            
            // Map customer names to ledger IDs
            const ledgerMapping = await Ledger.find({ 
                company_id: req.user.restaurant_id, 
                group: 'SUNDRY_DEBTORS' 
            }).select('name _id');
            const ledgerMap = {};
            ledgerMapping.forEach(l => {
                const baseName = l.name.replace(' (Customer)', '');
                ledgerMap[baseName] = l._id;
            });

            bills.forEach(b => {
                const diffDays = Math.ceil((now - new Date(b.createdAt)) / (1000 * 60 * 60 * 24));
                let agingCategory = '';

                if (diffDays <= 30) { ranges['0-30'] += b.grand_total; agingCategory = '0-30'; }
                else if (diffDays <= 60) { ranges['30-60'] += b.grand_total; agingCategory = '30-60'; }
                else { ranges['60+'] += b.grand_total; agingCategory = '60+'; }

                const entityName = b.customer_id?.name || b.customer_name || 'Walk-in / Unknown';
                detailedList.push({
                    type: 'SALE',
                    id: b._id,
                    reference: b.bill_number,
                    entity: entityName,
                    ledger_id: ledgerMap[entityName] || null,
                    date: b.createdAt,
                    amount: b.grand_total,
                    age: diffDays,
                    category: agingCategory
                });
            });
        }

        res.status(200).json({ success: true, data: ranges, details: detailedList.sort((a, b) => b.age - a.age) });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Get Account Balances (Cash/Bank)
// @route   GET /api/reports/account-balances
// @access  Private (Admin, Owner)
exports.getAccountBalances = async (req, res) => {
    try {
        const { type } = req.query; // 'CASH' or 'BANK'

        const filter = { company_id: req.user.restaurant_id };
        if (type === 'CASH') filter.group = 'CASH_IN_HAND';
        else if (type === 'BANK') filter.group = 'BANK_ACCOUNTS';
        else return res.status(400).json({ success: false, error: 'Valid type (CASH or BANK) required' });

        const ledgers = await Ledger.find(filter);

        const balances = ledgers.map(l => ({
            id: l._id,
            name: l.name,
            opening_balance: l.opening_balance || 0,
            current_balance: l.opening_balance // Future enhancement: compute real-time balance from vouchers
        })).sort((a, b) => b.current_balance - a.current_balance);

        const totalBalance = balances.reduce((sum, b) => sum + b.current_balance, 0);

        res.status(200).json({ success: true, data: balances, totalBalance });
    } catch (error) {
        console.error('Account Balances Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get Profit & Loss Report
exports.getProfitLoss = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
        let end = new Date(endDate || new Date());
        end.setHours(23, 59, 59, 999);

        const company_id = req.user.restaurant_id;

        const [bills, purchases, expenseVouchers] = await Promise.all([
            Bill.find({ company_id, status: 'PAID', createdAt: { $gte: start, $lte: end } }),
            Purchase.find({ company_id, purchase_date: { $gte: start, $lte: end } }),
            require('../models/Voucher').find({ company_id, voucher_type: 'PAYMENT', date: { $gte: start, $lte: end } }).populate({ path: 'debit_ledger', match: { group: 'EXPENSE' } })
        ]);

        const totalSales = bills.reduce((sum, b) => sum + b.grand_total, 0);
        const totalPurchases = purchases.reduce((sum, p) => sum + p.grand_total, 0);

        // Only count vouchers where the debit ledger is an EXPENSE
        const indirectExpenses = expenseVouchers.filter(v => v.debit_ledger).reduce((sum, v) => sum + v.amount, 0);

        const grossProfit = totalSales - totalPurchases;
        const netProfit = grossProfit - indirectExpenses;

        res.status(200).json({
            success: true,
            data: {
                income: { sales: totalSales, total: totalSales },
                direct_expenses: { purchases: totalPurchases, total: totalPurchases },
                indirect_expenses: { expenses: indirectExpenses, total: indirectExpenses },
                gross_profit: grossProfit,
                net_profit: netProfit
            }
        });
    } catch (error) { res.status(500).json({ success: false, error: error.message }); }
};

// @desc    Get month-wise sales report
// @route   GET /api/reports/month-wise?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Admin, Owner)
exports.getMonthWiseReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let start, end;

        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            // Default to current year
            const today = new Date();
            start = new Date(today.getFullYear(), 0, 1);
            end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
        }

        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'PAID',
            createdAt: { $gte: start, $lte: end }
        }).sort({ createdAt: 1 });

        // Group by Month
        const months = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        let currentDate = new Date(start);
        currentDate.setDate(1);

        while (currentDate <= end) {
            const year = currentDate.getFullYear();
            const monthIdx = currentDate.getMonth();
            const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
            const monthLabel = `${monthNames[monthIdx]} ${year}`;

            if (!months[monthKey]) {
                months[monthKey] = {
                    month: monthLabel,
                    monthKey: monthKey,
                    totalSales: 0,
                    billCount: 0
                };
            }
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        bills.forEach(bill => {
            const d = new Date(bill.createdAt);
            const year = d.getFullYear();
            const monthIdx = d.getMonth();
            const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

            if (months[monthKey]) {
                months[monthKey].totalSales += bill.grand_total;
                months[monthKey].billCount += 1;
            }
        });

        const sortedMonths = Object.values(months).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

        res.status(200).json({
            success: true,
            data: {
                period: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] },
                totalSales: bills.reduce((sum, bill) => sum + bill.grand_total, 0),
                totalBills: bills.length,
                monthlyBreakdown: sortedMonths
            }
        });
    } catch (error) {
        console.error('Month-wise report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get day-wise purchase report
// @route   GET /api/reports/purchase/day-wise?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Admin, Owner)
exports.getDayWisePurchaseReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        let start = new Date();
        start.setDate(start.getDate() - 30);
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

        const purchases = await Purchase.find({
            company_id: req.user.restaurant_id,
            purchase_date: { $gte: start, $lte: end }
        }).sort({ purchase_date: 1 });

        // Group by day
        const dailyPurchases = {};
        const currentDate = new Date(start);

        // Initialize all dates in range
        while (currentDate <= end) {
            const dateKey = currentDate.toISOString().split('T')[0];
            dailyPurchases[dateKey] = {
                date: dateKey,
                totalPurchases: 0,
                billCount: 0
            };
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Populate with actual data
        purchases.forEach(p => {
            const dateKey = p.purchase_date.toISOString().split('T')[0];
            if (dailyPurchases[dateKey]) {
                dailyPurchases[dateKey].totalPurchases += p.grand_total;
                dailyPurchases[dateKey].billCount += 1;
            }
        });

        const purchaseData = Object.values(dailyPurchases);
        const totalAmount = purchaseData.reduce((sum, day) => sum + day.totalPurchases, 0);
        const totalDocs = purchaseData.reduce((sum, day) => sum + day.billCount, 0);

        res.status(200).json({
            success: true,
            data: {
                period: { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] },
                totalAmount,
                totalDocs,
                dailyBreakdown: purchaseData
            }
        });
    } catch (error) {
        console.error('Day-wise purchase report error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

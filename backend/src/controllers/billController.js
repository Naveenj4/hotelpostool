const Bill = require('../models/Bill');
const Counter = require('../models/Counter');
const Product = require('../models/Product');

// Helper to generate next Bill Number
const generateBillNumber = async (companyId) => {
    // Format: YYYYMMDD-XXXX (e.g., 20240209-0001)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    // Find last bill for this company today
    const lastBill = await Bill.findOne({
        company_id: companyId,
        bill_number: { $regex: `^${dateStr}` }
    }).sort({ bill_number: -1 });

    let nextNum = 1;
    if (lastBill) {
        const parts = lastBill.bill_number.split('-');
        if (parts.length === 2) {
            nextNum = parseInt(parts[1], 10) + 1;
        }
    }

    return `${dateStr}-${String(nextNum).padStart(4, '0')}`;
};

// @desc    Create a new OPEN bill
// @route   POST /api/bills
// @access  Admin/Owner/Billing
exports.createBill = async (req, res) => {
    try {
        const { counter_id, type } = req.body;

        // Verify Counter
        if (counter_id) {
            const counter = await Counter.findOne({ _id: counter_id, company_id: req.user.restaurant_id });
            if (!counter) return res.status(400).json({ success: false, error: 'Invalid Counter' });
        }

        const billNumber = await generateBillNumber(req.user.restaurant_id);

        const newBill = await Bill.create({
            company_id: req.user.restaurant_id,
            bill_number: billNumber,
            counter_id,
            status: 'OPEN', // Starts as OPEN
            type: type || 'SELF_SERVICE',
            created_by: req.user.id,
            items: [],
            grand_total: 0
        });

        res.status(201).json({ success: true, data: newBill });

    } catch (error) {
        console.error("Create Bill Error:", error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Add Item to Bill
// @route   POST /api/bills/:id/items
// @access  Admin/Owner/Billing
exports.addItemToBill = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        const bill = await Bill.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!bill) return res.status(404).json({ success: false, error: 'Bill not found' });
        if (bill.status !== 'OPEN' && bill.status !== 'DRAFT') {
            return res.status(400).json({ success: false, error: 'Bill is locked' });
        }

        const product = await Product.findOne({ _id: product_id, company_id: req.user.restaurant_id });
        if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
        if (!product.is_active) return res.status(400).json({ success: false, error: 'Product is inactive' });

        // Stock Check - only for products that track stock
        if (product.opening_stock > 0 || product.current_stock > 0) {
            if (product.current_stock < quantity) {
                return res.status(400).json({ success: false, error: `Insufficient stock for ${product.name}. Available: ${product.current_stock}` });
            }
        }

        // Add or Update Item
        const existingItemIndex = bill.items.findIndex(p => p.product_id.toString() === product_id);

        let newItemTotal = 0;

        if (existingItemIndex > -1) {
            // Update quantity
            bill.items[existingItemIndex].quantity += quantity;
            bill.items[existingItemIndex].total_price = bill.items[existingItemIndex].quantity * bill.items[existingItemIndex].unit_price;
        } else {
            // New Item
            bill.items.push({
                product_id: product._id,
                name: product.name,
                category: product.category,
                quantity,
                unit_price: product.selling_price,
                total_price: quantity * product.selling_price
            });
        }

        // Recalculate Totals
        const subTotal = bill.items.reduce((acc, item) => acc + item.total_price, 0);
        bill.sub_total = subTotal;
        bill.grand_total = subTotal; // Add tax logic here if needed

        await bill.save();
        res.status(200).json({ success: true, data: bill });

    } catch (error) {
        console.error("Add Item Error:", error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get Single Bill
// @route   GET /api/bills/:id
// @access  Protected
exports.getBill = async (req, res) => {
    try {
        const bill = await Bill.findOne({ _id: req.params.id, company_id: req.user.restaurant_id })
            .populate('counter_id', 'name code')
            .populate('created_by', 'name');

        if (!bill) return res.status(404).json({ success: false, error: 'Bill not found' });

        res.status(200).json({ success: true, data: bill });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Remove Item from Bill
// @route   DELETE /api/bills/:id/items/:productId
// @access  Admin/Owner/Billing
exports.removeItemFromBill = async (req, res) => {
    try {
        const { id, productId } = req.params;
        const bill = await Bill.findOne({ _id: id, company_id: req.user.restaurant_id });

        if (!bill) return res.status(404).json({ success: false, error: 'Bill not found' });
        if (bill.status !== 'OPEN' && bill.status !== 'DRAFT') {
            return res.status(400).json({ success: false, error: 'Bill is locked' });
        }

        // Remove the item
        bill.items = bill.items.filter(item => item.product_id.toString() !== productId);

        // Recalculate totals
        const subTotal = bill.items.reduce((acc, item) => acc + item.total_price, 0);
        bill.sub_total = subTotal;
        bill.grand_total = subTotal; // Add tax logic here if needed

        await bill.save();
        res.status(200).json({ success: true, data: bill });

    } catch (error) {
        console.error("Remove Item Error:", error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};
exports.processPayment = async (req, res) => {
    try {
        const { payment_modes, sub_total, tax_amount, discount_amount, grand_total, table_no, persons, customer_name, customer_phone, captain_name, waiter_name } = req.body;
        const bill = await Bill.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!bill) return res.status(404).json({ success: false, error: 'Bill not found' });
        if (bill.status === 'PAID') return res.status(400).json({ success: false, error: 'Bill already paid' });

        // Validate payment_modes array exists and is not empty
        if (!payment_modes || !Array.isArray(payment_modes) || payment_modes.length === 0) {
            return res.status(400).json({ success: false, error: 'Payment modes array is required and cannot be empty' });
        }

        // Calculate total paid from all payment modes
        let totalPaid = 0;
        for (const payment of payment_modes) {
            if (!payment.type || !['CASH', 'UPI', 'CARD', 'ONLINE', 'SPLIT'].includes(payment.type)) {
                return res.status(400).json({ success: false, error: 'Invalid payment type. Must be CASH, UPI, CARD, ONLINE, or SPLIT' });
            }

            if (typeof payment.amount !== 'number' || payment.amount <= 0) {
                return res.status(400).json({ success: false, error: 'Payment amount must be a positive number' });
            }

            totalPaid += payment.amount;
        }

        // Final totals (prefer values from frontend but fallback to bill values)
        const finalGrandTotal = grand_total !== undefined ? grand_total : bill.grand_total;

        // Validate that total paid is at least equal to grand total
        if (totalPaid < (finalGrandTotal - 0.1)) { // Small buffer for float math
            return res.status(400).json({ success: false, error: 'Total payment amount is less than bill amount' });
        }

        // Update bill status and final financial values
        bill.status = 'PAID';
        bill.payment_modes = payment_modes;
        bill.total_paid = totalPaid;
        bill.sub_total = sub_total !== undefined ? sub_total : bill.sub_total;
        bill.tax_amount = tax_amount !== undefined ? tax_amount : bill.tax_amount;
        bill.discount_amount = discount_amount !== undefined ? discount_amount : bill.discount_amount;
        bill.grand_total = finalGrandTotal;
        bill.table_no = table_no !== undefined ? table_no : bill.table_no;
        bill.persons = persons !== undefined ? persons : bill.persons;
        bill.customer_name = customer_name !== undefined ? customer_name : bill.customer_name;
        bill.customer_phone = customer_phone !== undefined ? customer_phone : bill.customer_phone;
        bill.captain_name = captain_name !== undefined ? captain_name : bill.captain_name;
        bill.waiter_name = waiter_name !== undefined ? waiter_name : bill.waiter_name;

        if (payment_modes.length === 1) {
            bill.payment_mode = payment_modes[0].type;
        } else {
            bill.payment_mode = 'SPLIT';
        }

        const cashPayment = payment_modes.find(pm => pm.type === 'CASH');
        if (cashPayment) {
            bill.payment_details = bill.payment_details || {};
            bill.payment_details.cash_received = cashPayment.cash_received;
            bill.payment_details.change_returned = cashPayment.balance_return;
        }

        const StockTransaction = require('../models/StockTransaction');
        for (const item of bill.items) {
            const product = await Product.findOne({ _id: item.product_id, company_id: req.user.restaurant_id });
            if (product) {
                const prev = product.current_stock;
                product.current_stock -= item.quantity;
                await product.save();

                await StockTransaction.create({
                    company_id: req.user.restaurant_id, product_id: product._id, type: 'OUT',
                    quantity: -item.quantity, previous_stock: prev, new_stock: product.current_stock,
                    reference_type: 'SALE', reference_id: bill._id, remark: `Sale Bill ${bill.bill_number}`
                });
            }
        }

        await bill.save();

        // ACCOUNTING: Double Entry Integration
        try {
            const Ledger = require('../models/Ledger');
            const AccountTransaction = require('../models/AccountTransaction');
            const coId = req.user.restaurant_id;

            const salesL = await Ledger.findOne({ company_id: coId, name: 'Sales Account' });
            if (salesL) {
                await AccountTransaction.create({
                    company_id: coId, ledger_id: salesL._id, type: 'CREDIT', amount: bill.grand_total,
                    voucher_type: 'SALES', voucher_number: bill.bill_number, reference_id: bill._id,
                    narration: `Sale - Bill ${bill.bill_number}`, date: new Date()
                });
                await Ledger.findByIdAndUpdate(salesL._id, { $inc: { opening_balance: -bill.grand_total } });

                for (const pm of payment_modes) {
                    let accName = pm.type === 'CASH' ? 'Cash in Hand' : 'HDFC Bank';
                    const payL = await Ledger.findOne({ company_id: coId, name: accName });
                    if (payL) {
                        await AccountTransaction.create({
                            company_id: coId, ledger_id: payL._id, type: 'DEBIT', amount: pm.amount,
                            voucher_type: 'SALES', voucher_number: bill.bill_number, reference_id: bill._id,
                            narration: `Receipt - Bill ${bill.bill_number} (${pm.type})`, date: new Date()
                        });
                        await Ledger.findByIdAndUpdate(payL._id, { $inc: { opening_balance: pm.amount } });
                    }
                }
            }
        } catch (accErr) {
            console.error("Accounting Integration Error:", accErr);
        }

        res.status(200).json({ success: true, data: bill });

    } catch (error) {
        console.error("Payment Error:", error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.updateBill = async (req, res) => {
    try {
        const { items, status, kitchen_status, sub_total, tax_amount, discount_amount, delivery_charge, container_charge, round_off, grand_total, table_no, persons, order_mode, customer_name, customer_phone, captain_name, waiter_name } = req.body;
        const bill = await Bill.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!bill) return res.status(404).json({ success: false, error: 'Bill not found' });
        if (bill.status === 'PAID') return res.status(400).json({ success: false, error: 'Bill already paid' });

        if (items) bill.items = items;
        if (status) bill.status = status;
        if (kitchen_status) bill.kitchen_status = kitchen_status;
        if (sub_total !== undefined) bill.sub_total = sub_total;
        if (tax_amount !== undefined) bill.tax_amount = tax_amount;
        if (discount_amount !== undefined) bill.discount_amount = discount_amount;
        if (grand_total !== undefined) bill.grand_total = grand_total;
        if (delivery_charge !== undefined) bill.delivery_charge = delivery_charge;
        if (container_charge !== undefined) bill.container_charge = container_charge;
        if (round_off !== undefined) bill.round_off = round_off;

        bill.table_no = table_no !== undefined ? table_no : bill.table_no;
        bill.persons = persons !== undefined ? persons : bill.persons;
        bill.type = order_mode || bill.type;
        bill.customer_name = customer_name !== undefined ? customer_name : bill.customer_name;
        bill.customer_phone = customer_phone !== undefined ? customer_phone : bill.customer_phone;
        bill.captain_name = captain_name !== undefined ? captain_name : bill.captain_name;
        bill.waiter_name = waiter_name !== undefined ? waiter_name : bill.waiter_name;

        await bill.save();
        res.status(200).json({ success: true, data: bill });
    } catch (error) {
        console.error("Update Bill Error:", error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get all bills for a restaurant with date range filter
// @route   GET /api/bills?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Admin/Owner
exports.getAllBills = async (req, res) => {
    try {
        const { startDate, endDate, status, search } = req.query;

        let start, end;

        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        }

        const query = {
            company_id: req.user.restaurant_id
        };

        if (start && end) {
            query.createdAt = { $gte: start, $lte: end };
        }

        if (status) {
            query.status = status;
        } else if (!search) {
            // Default to PAID if no status or search specified
            query.status = 'PAID';
        }

        if (search) {
            query.$or = [
                { bill_number: { $regex: search, $options: 'i' } },
                { table_no: { $regex: search, $options: 'i' } },
                { customer_name: { $regex: search, $options: 'i' } }
            ];
        }

        const bills = await Bill.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: bills,
            count: bills.length
        });
    } catch (error) {
        console.error("Get Bills Error:", error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Cancel/Delete Bill and revert stock
// @route   DELETE /api/bills/:id
// @access  Admin/Owner
exports.cancelBill = async (req, res) => {
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const bill = await Bill.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!bill) return res.status(404).json({ success: false, error: 'Bill not found' });

        if (bill.status === 'PAID') {
            const StockTransaction = require('../models/StockTransaction');
            // Revert Stock
            for (const item of bill.items) {
                const product = await Product.findOne({ _id: item.product_id, company_id: req.user.restaurant_id }).session(session);
                if (product) {
                    const prev = product.current_stock;
                    product.current_stock += item.quantity;
                    await product.save({ session });

                    // Log Reversal
                    await StockTransaction.create([{
                        company_id: req.user.restaurant_id,
                        product_id: product._id,
                        type: 'IN',
                        quantity: item.quantity,
                        previous_stock: prev,
                        new_stock: product.current_stock,
                        reference_type: 'SALE',
                        remark: `Bill Cancelled: ${bill.bill_number}`
                    }], { session });
                }
            }
        }

        await Bill.findByIdAndDelete(req.params.id).session(session);

        await session.commitTransaction();
        res.status(200).json({ success: true, message: 'Bill cancelled and stock reverted' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
};

const Voucher = require('../models/Voucher');
const Bill = require('../models/Bill');
const Ledger = require('../models/Ledger');
const Customer = require('../models/Customer');
const AccountTransaction = require('../models/AccountTransaction');
const mongoose = require('mongoose');

// @desc    Get all Receipt Vouchers (specifically mapped to customers/bills)
exports.getReceipts = async (req, res) => {
    try {
        const { startDate, endDate, search } = req.query;
        let query = { 
            company_id: req.user.restaurant_id, 
            is_deleted: { $ne: true },
            voucher_type: 'RECEIPT',
            party_id: { $exists: true } // Ensuring it is a party receipt
        };

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate + 'T00:00:00.000Z');
            if (endDate) query.date.$lte = new Date(endDate + 'T23:59:59.999Z');
        }

        if (search) {
            query.$or = [
                { voucher_number: { $regex: search, $options: 'i' } }
            ];
        }

        const receipts = await Voucher.find(query)
            .populate('party_id', 'name phone')
            .populate('debit_ledger', 'name')
            .sort({ date: -1, createdAt: -1 });

        res.status(200).json({ success: true, count: receipts.length, data: receipts });
    } catch (error) {
        console.error('getReceipts error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get Unpaid Bills for a Party (Customer)
exports.getUnpaidBills = async (req, res) => {
    try {
        const { partyId } = req.params;
        const bills = await Bill.aggregate([
            { 
                $match: { 
                    company_id: req.user.restaurant_id,
                    customer_id: new mongoose.Types.ObjectId(partyId),
                    is_deleted: { $ne: true },
                    $expr: { $gt: ["$grand_total", "$total_paid"] }
                } 
            },
            {
                $project: {
                    bill_number: 1,
                    createdAt: 1,
                    grand_total: 1,
                    total_paid: 1,
                    due_amount: { $subtract: ["$grand_total", "$total_paid"] },
                    due_days: { $literal: 0 }, // For UI display
                }
            },
            { $sort: { createdAt: 1 } }
        ]);

        res.status(200).json({ success: true, data: bills });
    } catch (error) {
        console.error('getUnpaidBills error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get Stats for Receipts UI
exports.getReceiptStats = async (req, res) => {
    try {
        const company_id = req.user.restaurant_id;

        // 1. Total Receivable (Sum of outstanding from all customers)
        const customers = await Customer.find({ company_id });
        const total_receivable = customers.reduce((acc, c) => acc + (c.opening_balance || 0), 0);

        // 2. Paid / Unpaid calculations can also be derived here if needed
        // For simplicity, returning just basic aggregates
        const [receiptAgg] = await Voucher.aggregate([
            { 
                $match: { 
                    company_id, 
                    is_deleted: { $ne: true }, 
                    voucher_type: 'RECEIPT', 
                    party_id: { $exists: true } 
                } 
            },
            {
                $group: {
                    _id: null,
                    total_paid: { $sum: '$amount' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                total_receivable,
                total_paid: receiptAgg?.total_paid || 0,
                unpaid: total_receivable // As customers pay, opening balance decreases, so current opening_balance is the true unpaid
            }
        });

    } catch (error) {
        console.error('getReceiptStats error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create a Receipt and settle bills
exports.createReceipt = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { 
            party_id, receipt_no, date, amount, received_amount, paymode_ledger_id, 
            narration, settled_bills // [{ bill_id, amount_settled }]
        } = req.body;
        
        const company_id = req.user.restaurant_id;
        const amt = parseFloat(received_amount || amount) || 0;

        // 1. Verify Customer
        const customer = await Customer.findOne({ _id: party_id, company_id }).session(session);
        if (!customer) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        // 2. Resolve Customer Ledger (to act as credit_ledger)
        let customerLedger = await Ledger.findOne({ company_id, name: customer.name }).session(session);
        if (!customerLedger) {
            // Create one on the fly if it doesn't exist
            [customerLedger] = await Ledger.create([{
                company_id,
                name: customer.name,
                group: 'Sundry Debtors',
                nature: 'ASSET',
                opening_balance: customer.opening_balance || 0
            }], { session });
        }

        // 3. Update individual Bills
        let validSettledBills = [];
        if (settled_bills && settled_bills.length > 0) {
            for (let b of settled_bills) {
                if (!b.amount_settled || b.amount_settled <= 0) continue;
                
                const bill = await Bill.findOne({ _id: b.bill_id, company_id }).session(session);
                if (bill) {
                    bill.total_paid = (bill.total_paid || 0) + parseFloat(b.amount_settled);
                    if (bill.total_paid >= bill.grand_total) bill.status = 'PAID';
                    await bill.save({ session });
                    validSettledBills.push(b);
                }
            }
        }

        // 4. Update Customer Balance
        customer.opening_balance = Math.max(0, (customer.opening_balance || 0) - amt);
        await customer.save({ session });

        // 5. Create Voucher (RECEIPT)
        const [voucher] = await Voucher.create([{
            company_id,
            voucher_type: 'RECEIPT',
            voucher_number: receipt_no || `REC-${Date.now().toString().slice(-6)}`,
            date: date || new Date(),
            debit_ledger: paymode_ledger_id, // e.g., Cash or Bank ledger
            credit_ledger: customerLedger._id,
            amount: amt,
            party_id: customer._id,
            narration: narration || `Receipt against customer ${customer.name}`,
            settled_bills: validSettledBills
        }], { session });

        // 6. Generate Accounting Entries
        const vid = voucher._id;
        
        // DEBIT (Cash/Bank increase)
        await AccountTransaction.create([{
            company_id, ledger_id: paymode_ledger_id, type: 'DEBIT',
            amount: amt, voucher_type: 'RECEIPT', voucher_number: voucher.voucher_number,
            reference_id: vid, narration: voucher.narration, date: voucher.date
        }], { session });
        await Ledger.findByIdAndUpdate(paymode_ledger_id, { $inc: { opening_balance: amt } }, { session });

        // CREDIT (Customer Debt decrease)
        await AccountTransaction.create([{
            company_id, ledger_id: customerLedger._id, type: 'CREDIT',
            amount: amt, voucher_type: 'RECEIPT', voucher_number: voucher.voucher_number,
            reference_id: vid, narration: voucher.narration, date: voucher.date
        }], { session });
        await Ledger.findByIdAndUpdate(customerLedger._id, { $inc: { opening_balance: -amt } }, { session });

        await session.commitTransaction();
        res.status(201).json({ success: true, data: voucher });

    } catch (error) {
        await session.abortTransaction();
        console.error('createReceipt error:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
};

// @desc    Delete a Receipt (Revert balances)
exports.deleteReceipt = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const company_id = req.user.restaurant_id;
        const voucher = await Voucher.findOne({ _id: req.params.id, company_id, voucher_type: 'RECEIPT' });

        if (!voucher) return res.status(404).json({ success: false, error: 'Receipt not found' });
        if (voucher.is_deleted) return res.status(400).json({ success: false, error: 'Receipt already deleted' });

        // 1. Mark as deleted
        voucher.is_deleted = true;
        await voucher.save({ session });

        // 2. Revert Customer Balance
        if (voucher.party_id) {
            await Customer.findByIdAndUpdate(voucher.party_id, { $inc: { opening_balance: voucher.amount } }, { session });
        }

        // 3. Revert Ledger Balances
        if (voucher.debit_ledger) await Ledger.findByIdAndUpdate(voucher.debit_ledger, { $inc: { opening_balance: -voucher.amount } }, { session });
        if (voucher.credit_ledger) await Ledger.findByIdAndUpdate(voucher.credit_ledger, { $inc: { opening_balance: voucher.amount } }, { session });

        // 4. Soft delete Account Transactions
        await AccountTransaction.updateMany({ reference_id: voucher._id, company_id }, { is_deleted: true }, { session });

        // 5. Revert settled bills
        if (voucher.settled_bills && voucher.settled_bills.length > 0) {
            for (let b of voucher.settled_bills) {
                const bill = await Bill.findOne({ _id: b.bill_id, company_id }).session(session);
                if (bill) {
                    bill.total_paid = Math.max(0, (bill.total_paid || 0) - b.amount_settled);
                    if (bill.total_paid < bill.grand_total) {
                        bill.status = bill.payment_mode === 'PENDING' ? 'OPEN' : 'DUE'; // Just mapping fallback
                    }
                    await bill.save({ session });
                }
            }
        }

        await session.commitTransaction();
        res.status(200).json({ success: true, message: 'Receipt deleted and balances reverted.' });
    } catch (error) {
        await session.abortTransaction();
        console.error('deleteReceipt error:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
};

const Voucher = require('../models/Voucher');
const Purchase = require('../models/Purchase');
const Ledger = require('../models/Ledger');
const Supplier = require('../models/Supplier');
const AccountTransaction = require('../models/AccountTransaction');
const mongoose = require('mongoose');

// @desc    Get all Payment Vouchers
exports.getPayments = async (req, res) => {
    try {
        const { startDate, endDate, search } = req.query;
        let query = {
            company_id: req.user.restaurant_id,
            is_deleted: { $ne: true },
            voucher_type: 'PAYMENT',
            party_id: { $exists: true }
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

        const payments = await Voucher.find(query)
            .populate('party_ledger_id', 'name')
            .populate('debit_ledger', 'name')
            .populate('credit_ledger', 'name')
            .sort({ date: -1, createdAt: -1 });

        res.status(200).json({ success: true, count: payments.length, data: payments });
    } catch (error) {
        console.error('getPayments error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get Unpaid Purchase Bills for a Supplier (by ledger_id)
exports.getSupplierUnpaidBills = async (req, res) => {
    try {
        const { ledgerId } = req.params;
        const company_id = req.user.restaurant_id;

        // Find supplier by matching ledger name
        const ledger = await Ledger.findOne({ _id: ledgerId, company_id });
        if (!ledger) return res.status(404).json({ success: false, error: 'Ledger not found' });

        // Match supplier by name (supplier's name matches ledger name)
        const supplier = await Supplier.findOne({ company_id, name: ledger.name });

        let bills = [];
        if (supplier) {
            bills = await Purchase.aggregate([
                {
                    $match: {
                        company_id: new mongoose.Types.ObjectId(company_id),
                        supplier_id: supplier._id,
                        is_deleted: { $ne: true },
                        payment_status: { $in: ['UNPAID', 'PARTIAL'] }
                    }
                },
                {
                    $project: {
                        bill_number: '$invoice_number',
                        createdAt: '$invoice_date',
                        grand_total: 1,
                        total_paid: '$paid_amount',
                        due_amount: '$due_amount',
                        due_days: 1,
                        due_date: 1,
                        payment_status: 1
                    }
                },
                { $sort: { createdAt: 1 } }
            ]);
        }

        res.status(200).json({ success: true, data: bills, ledger_name: ledger.name });
    } catch (error) {
        console.error('getSupplierUnpaidBills error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get Payment Stats
exports.getPaymentStats = async (req, res) => {
    try {
        const company_id = req.user.restaurant_id;

        // Total payable = sum of supplier outstanding
        const suppliers = await Supplier.find({ company_id });
        const total_payable = suppliers.reduce((acc, s) => acc + (s.opening_balance || 0), 0);

        const [paymentAgg] = await Voucher.aggregate([
            {
                $match: {
                    company_id,
                    is_deleted: { $ne: true },
                    voucher_type: 'PAYMENT',
                    party_id: { $exists: true }
                }
            },
            { $group: { _id: null, total_paid: { $sum: '$amount' } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                total_payable,
                total_paid: paymentAgg?.total_paid || 0,
                unpaid: total_payable
            }
        });
    } catch (error) {
        console.error('getPaymentStats error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create a Payment and settle purchase bills
exports.createPayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            party_ledger_id, payment_no, date, paid_amount, paymode_ledger_id,
            reference_no, narration, settled_bills // [{ bill_id, amount_settled }]
        } = req.body;

        const company_id = req.user.restaurant_id;
        const amt = parseFloat(paid_amount) || 0;

        if (!party_ledger_id || !paymode_ledger_id || amt <= 0) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, error: 'Party, Paymode and Amount are required' });
        }

        // 1. Verify party ledger
        const partyLedger = await Ledger.findOne({ _id: party_ledger_id, company_id }).session(session);
        if (!partyLedger) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, error: 'Party ledger not found' });
        }

        // 2. Verify paymode ledger
        const paymodeLedger = await Ledger.findOne({ _id: paymode_ledger_id, company_id }).session(session);
        if (!paymodeLedger) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, error: 'Paymode ledger not found' });
        }

        // 3. Try to find matching supplier and settle purchase bills
        const supplier = await Supplier.findOne({ company_id, name: partyLedger.name }).session(session);
        let validSettledBills = [];

        if (settled_bills && settled_bills.length > 0 && supplier) {
            for (let b of settled_bills) {
                if (!b.amount_settled || b.amount_settled <= 0) continue;
                const purchase = await Purchase.findOne({ _id: b.bill_id, company_id }).session(session);
                if (purchase) {
                    purchase.paid_amount = (purchase.paid_amount || 0) + parseFloat(b.amount_settled);
                    purchase.due_amount = Math.max(0, purchase.grand_total - purchase.paid_amount);
                    if (purchase.paid_amount >= purchase.grand_total) purchase.payment_status = 'PAID';
                    else if (purchase.paid_amount > 0) purchase.payment_status = 'PARTIAL';
                    await purchase.save({ session });
                    validSettledBills.push(b);
                }
            }
        }

        // 4. Update supplier balance
        if (supplier) {
            supplier.opening_balance = Math.max(0, (supplier.opening_balance || 0) - amt);
            await supplier.save({ session });
        }

        // 5. Update party ledger balance
        await Ledger.findByIdAndUpdate(party_ledger_id, { $inc: { opening_balance: -amt } }, { session });

        // 6. Deduct from paymode ledger (cash/bank goes out)
        await Ledger.findByIdAndUpdate(paymode_ledger_id, { $inc: { opening_balance: -amt } }, { session });

        // 7. Create Voucher (PAYMENT)
        const [voucher] = await Voucher.create([{
            company_id,
            voucher_type: 'PAYMENT',
            voucher_number: payment_no || `PAY-${Date.now().toString().slice(-6)}`,
            date: date || new Date(),
            debit_ledger: party_ledger_id,    // Supplier ledger is debited (liability decreases)
            credit_ledger: paymode_ledger_id, // Cash/Bank is credited (asset decreases)
            amount: amt,
            party_id: supplier?._id || undefined,
            party_ledger_id,
            reference_no: reference_no || '',
            narration: narration || `Payment to ${partyLedger.name}`,
            settled_bills: validSettledBills.map(b => ({ bill_id: b.bill_id, amount_settled: b.amount_settled }))
        }], { session });

        // 8. Generate Account Transactions
        await AccountTransaction.create([{
            company_id, ledger_id: party_ledger_id, type: 'DEBIT',
            amount: amt, voucher_type: 'PAYMENT', voucher_number: voucher.voucher_number,
            reference_id: voucher._id, narration: voucher.narration, date: voucher.date
        }], { session });

        await AccountTransaction.create([{
            company_id, ledger_id: paymode_ledger_id, type: 'CREDIT',
            amount: amt, voucher_type: 'PAYMENT', voucher_number: voucher.voucher_number,
            reference_id: voucher._id, narration: voucher.narration, date: voucher.date
        }], { session });

        await session.commitTransaction();
        res.status(201).json({ success: true, data: voucher });

    } catch (error) {
        await session.abortTransaction();
        console.error('createPayment error:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
};

// @desc    Delete a Payment (Revert balances)
exports.deletePayment = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const company_id = req.user.restaurant_id;
        const voucher = await Voucher.findOne({ _id: req.params.id, company_id, voucher_type: 'PAYMENT' });

        if (!voucher) return res.status(404).json({ success: false, error: 'Payment not found' });
        if (voucher.is_deleted) return res.status(400).json({ success: false, error: 'Payment already deleted' });

        voucher.is_deleted = true;
        await voucher.save({ session });

        // Revert party ledger
        if (voucher.debit_ledger) await Ledger.findByIdAndUpdate(voucher.debit_ledger, { $inc: { opening_balance: voucher.amount } }, { session });
        // Revert paymode ledger
        if (voucher.credit_ledger) await Ledger.findByIdAndUpdate(voucher.credit_ledger, { $inc: { opening_balance: voucher.amount } }, { session });

        // Revert supplier balance
        if (voucher.party_id) {
            await Supplier.findByIdAndUpdate(voucher.party_id, { $inc: { opening_balance: voucher.amount } }, { session });
        }

        // Soft-delete account transactions
        await AccountTransaction.updateMany({ reference_id: voucher._id, company_id }, { is_deleted: true }, { session });

        // Revert settled purchase bills
        if (voucher.settled_bills && voucher.settled_bills.length > 0) {
            for (let b of voucher.settled_bills) {
                const purchase = await Purchase.findOne({ _id: b.bill_id, company_id }).session(session);
                if (purchase) {
                    purchase.paid_amount = Math.max(0, (purchase.paid_amount || 0) - b.amount_settled);
                    purchase.due_amount = purchase.grand_total - purchase.paid_amount;
                    if (purchase.paid_amount <= 0) purchase.payment_status = 'UNPAID';
                    else purchase.payment_status = 'PARTIAL';
                    await purchase.save({ session });
                }
            }
        }

        await session.commitTransaction();
        res.status(200).json({ success: true, message: 'Payment deleted and balances reverted.' });
    } catch (error) {
        await session.abortTransaction();
        console.error('deletePayment error:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
};

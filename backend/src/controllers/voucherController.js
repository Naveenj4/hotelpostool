const Voucher = require('../models/Voucher');
const Ledger = require('../models/Ledger');
const mongoose = require('mongoose');

exports.getVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find({ company_id: req.user.restaurant_id })
            .populate('debit_ledger', 'name group')
            .populate('credit_ledger', 'name group')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: vouchers.length, data: vouchers });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.createVoucher = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { voucher_type, voucher_number, date, debit_ledger, credit_ledger, amount, narration, reference_id } = req.body;
        const company_id = req.user.restaurant_id;

        // 1. Create the voucher record
        const voucher = await Voucher.create([{
            company_id,
            voucher_type,
            voucher_number,
            date: date || Date.now(),
            debit_ledger,
            credit_ledger,
            amount,
            narration,
            reference_id
        }], { session });

        // 2. Adjust Ledger Balances
        // Debit the receiver (Debit side)
        // For Debit Ledger: Opening Balance increases if it's DR type, decreases if CR type?
        // Actually accounting logic: 
        // Debit: Increases an Asset or Expense, Decreases a Liability or Income.
        // Credit: Decreases an Asset or Expense, Increases a Liability or Income.

        // This is complex for a simple POS. Let's stick to a simpler "Net Balance" approach 
        // or just incrementing the numeric value based on its 'DR'/'CR' side.

        // Let's use simplified logic:
        // Debit side increases Debit Ledger numeric balance
        // Credit side increases Credit Ledger numeric balance 
        // (Assuming the numeric value is the 'absolute' balance and we just need to track the side)

        // More standard: 
        // updateLedgerBalance(ledgerId, amount, type)

        await Ledger.findOneAndUpdate({ _id: debit_ledger, company_id }, { $inc: { opening_balance: amount } }, { session });
        await Ledger.findOneAndUpdate({ _id: credit_ledger, company_id }, { $inc: { opening_balance: -amount } }, { session });

        await session.commitTransaction();
        res.status(201).json({ success: true, data: voucher[0] });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
};

exports.deleteVoucher = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const voucher = await Voucher.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!voucher) return res.status(404).json({ success: false, error: 'Voucher not found' });

        // Reverse balances
        await Ledger.findOneAndUpdate({ _id: voucher.debit_ledger, company_id: req.user.restaurant_id }, { $inc: { opening_balance: -voucher.amount } }, { session });
        await Ledger.findOneAndUpdate({ _id: voucher.credit_ledger, company_id: req.user.restaurant_id }, { $inc: { opening_balance: voucher.amount } }, { session });

        await Voucher.findByIdAndDelete(req.params.id, { session });

        await session.commitTransaction();
        res.status(200).json({ success: true, message: 'Voucher deleted and balances reverted' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
};

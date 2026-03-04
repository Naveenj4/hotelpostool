const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const mongoose = require('mongoose');

exports.getPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.find({ company_id: req.user.restaurant_id })
            .populate('supplier_id', 'name contact_person')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: purchases.length, data: purchases });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.createPurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { supplier_id, invoice_number, items, sub_total, tax_amount, other_charges, grand_total, paid_amount, purchase_date } = req.body;
        const company_id = req.user.restaurant_id;

        // 1. Create the purchase record
        const purchase = await Purchase.create([{
            company_id,
            supplier_id,
            invoice_number,
            items,
            sub_total,
            tax_amount,
            other_charges,
            grand_total,
            paid_amount: paid_amount || 0,
            due_amount: grand_total - (paid_amount || 0),
            purchase_date: purchase_date || Date.now(),
            payment_status: (paid_amount >= grand_total) ? 'PAID' : (paid_amount > 0 ? 'PARTIAL' : 'UNPAID')
        }], { session });

        // 2. Update stock for each product
        const StockTransaction = require('../models/StockTransaction');
        for (const item of items) {
            const product = await Product.findOne({ _id: item.product_id, company_id }).session(session);
            if (product) {
                const prev = product.current_stock;
                product.current_stock += item.quantity;
                product.purchase_price = item.purchase_rate;
                product.gst_purchase = item.gst_percent;
                await product.save({ session });

                await StockTransaction.create([{
                    company_id, product_id: product._id, type: 'IN', quantity: item.quantity,
                    previous_stock: prev, new_stock: product.current_stock,
                    reference_type: 'PURCHASE', reference_id: purchase[0]._id, remark: `Purchase Inv ${invoice_number}`
                }], { session });
            }
        }

        // 3. Update supplier balance (Amount we owe them)
        const balanceChange = grand_total - (paid_amount || 0);
        await Supplier.findOneAndUpdate(
            { _id: supplier_id, company_id },
            { $inc: { opening_balance: balanceChange } },
            { session }
        );

        await session.commitTransaction();
        res.status(201).json({ success: true, data: purchase[0] });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
};

exports.deletePurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const purchase = await Purchase.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found' });

        // Reverse stock updates
        const StockTransaction = require('../models/StockTransaction');
        const company_id = req.user.restaurant_id;

        for (const item of purchase.items) {
            const product = await Product.findOne({ _id: item.product_id, company_id }).session(session);
            if (product) {
                const prev = product.current_stock;
                product.current_stock -= item.quantity;
                await product.save({ session });

                await StockTransaction.create([{
                    company_id,
                    product_id: product._id,
                    type: 'OUT',
                    quantity: item.quantity,
                    previous_stock: prev,
                    new_stock: product.current_stock,
                    reference_type: 'PURCHASE',
                    remark: `Purchase Cancelled: ${purchase.invoice_number}`
                }], { session });
            }
        }

        // Reverse supplier balance
        const balanceToSubtract = purchase.grand_total - purchase.paid_amount;
        await Supplier.findOneAndUpdate(
            { _id: purchase.supplier_id, company_id: req.user.restaurant_id },
            { $inc: { opening_balance: -balanceToSubtract } },
            { session }
        );

        await Purchase.findByIdAndDelete(req.params.id, { session });

        await session.commitTransaction();
        res.status(200).json({ success: true, message: 'Purchase deleted and stock reverted' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, error: error.message });
    } finally {
        session.endSession();
    }
};

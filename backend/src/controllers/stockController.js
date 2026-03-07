const Product = require('../models/Product');
const StockTransaction = require('../models/StockTransaction');

// @desc    Get all products with stock information
exports.getStockItems = async (req, res) => {
    try {
        const products = await Product.find({ company_id: req.user.restaurant_id })
            .populate('category', 'name')
            .sort({ name: 1 });
        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Get low stock items (below reorder level)
exports.getLowStockItems = async (req, res) => {
    try {
        const products = await Product.find({
            company_id: req.user.restaurant_id,
            $expr: { $lt: ["$current_stock", "$reorder_level"] },
            is_active: true
        }).sort({ current_stock: 1 });

        res.status(200).json({ success: true, count: products.length, data: products });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Update stock for a single product with logging
exports.updateStock = async (req, res) => {
    try {
        const { current_stock, remark = 'Manual Adjustment' } = req.body;
        const product = await Product.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        const prevStock = product.current_stock;
        product.current_stock = current_stock;
        await product.save();

        // Log transaction
        await StockTransaction.create({
            company_id: req.user.restaurant_id,
            product_id: product._id,
            type: 'ADJUSTMENT',
            quantity: current_stock - prevStock,
            previous_stock: prevStock,
            new_stock: current_stock,
            reference_type: 'MANUAL',
            remark,
            performed_by: req.user.id
        });

        res.status(200).json({ success: true, data: product });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Bulk update stock for multiple products
exports.bulkUpdateStock = async (req, res) => {
    try {
        const { updates } = req.body; // Array of { productId, current_stock }
        const updatedProducts = [];
        for (const update of updates) {
            const product = await Product.findOne({ _id: update.productId, company_id: req.user.restaurant_id });
            if (product) {
                const prev = product.current_stock;
                product.current_stock = update.current_stock;
                await product.save();
                await StockTransaction.create({
                    company_id: req.user.restaurant_id, product_id: product._id, type: 'ADJUSTMENT',
                    quantity: update.current_stock - prev, previous_stock: prev, new_stock: update.current_stock,
                    reference_type: 'MANUAL', remark: 'Bulk Update', performed_by: req.user.id
                });
                updatedProducts.push(product);
            }
        }
        res.status(200).json({ success: true, message: `Updated ${updatedProducts.length} items`, data: updatedProducts });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// @desc    Get stock transaction history
exports.getStockHistory = async (req, res) => {
    try {
        const history = await StockTransaction.find({ company_id: req.user.restaurant_id })
            .populate('product_id', 'name')
            .populate('performed_by', 'username')
            .sort({ createdAt: -1 })
            .limit(100);
        res.status(200).json({ success: true, data: history });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
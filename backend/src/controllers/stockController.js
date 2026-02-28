const Product = require('../models/Product');

// @desc    Get all products with stock information
// @route   GET /api/stock
// @access  Private (Admin, Owner)
exports.getStockItems = async (req, res) => {
    try {
        const products = await Product.find({
            company_id: req.user.restaurant_id
        }).sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Get stock items error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get low stock items (below 10 units)
// @route   GET /api/products/low-stock
// @access  Private (Admin, Owner)
exports.getLowStockItems = async (req, res) => {
    try {
        const products = await Product.find({
            company_id: req.user.restaurant_id,
            current_stock: { $lt: 10 },
            is_active: true
        }).sort({ current_stock: 1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Get low stock items error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update stock for a single product
// @route   PUT /api/stock/:id
// @access  Private (Admin, Owner)
exports.updateStock = async (req, res) => {
    try {
        const { current_stock } = req.body;

        if (current_stock === undefined || current_stock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid current stock value is required'
            });
        }

        const product = await Product.findOne({
            _id: req.params.id,
            company_id: req.user.restaurant_id
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Stock-managed product not found'
            });
        }

        product.current_stock = current_stock;
        await product.save();

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Bulk update stock for multiple products
// @route   PUT /api/stock/bulk-update
// @access  Private (Admin, Owner)
exports.bulkUpdateStock = async (req, res) => {
    try {
        const { updates } = req.body; // Array of { productId, current_stock }

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid updates array is required'
            });
        }

        // Validate all updates
        for (const update of updates) {
            if (!update.productId || update.current_stock === undefined || update.current_stock < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Each update must have productId and valid current_stock'
                });
            }
        }

        // Update all products
        const updatedProducts = [];
        for (const update of updates) {
            const product = await Product.findOne({
                _id: update.productId,
                company_id: req.user.restaurant_id
            });

            if (product) {
                product.current_stock = update.current_stock;
                await product.save();
                updatedProducts.push(product);
            }
        }

        res.status(200).json({
            success: true,
            message: `Successfully updated ${updatedProducts.length} products`,
            data: updatedProducts
        });
    } catch (error) {
        console.error('Bulk update stock error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
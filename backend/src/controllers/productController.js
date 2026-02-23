const Product = require('../models/Product');

// @desc    Get all products (scoped to company)
// @route   GET /api/products
// @access  Private (Admin, Owner, Billing)
exports.getProducts = async (req, res) => {
    try {
        const { is_active } = req.query;
        let query = { company_id: req.user.restaurant_id };

        if (is_active) {
            query.is_active = is_active === 'true';
        }

        const products = await Product.find(query).sort({ created_at: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new product
// @route   POST /api/products
// @access  Private (Admin, Owner)
exports.createProduct = async (req, res) => {
    try {
        const { name, category, product_type, selling_price, purchase_price, opening_stock } = req.body;

        if (!name || !category || !product_type || selling_price === undefined) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        // Check if product type is valid
        if (!['TYPE_A', 'TYPE_B'].includes(product_type)) {
            return res.status(400).json({ success: false, message: 'Invalid product type' });
        }

        // Additional validation for TYPE_A
        if (product_type === 'TYPE_A') {
            if (purchase_price === undefined || opening_stock === undefined) {
                return res.status(400).json({ success: false, message: 'Purchase price and opening stock are required for TYPE_A products' });
            }
        }

        // Check for duplicates
        const exists = await Product.findOne({
            company_id: req.user.restaurant_id,
            name: { $regex: new RegExp(`^${name}$`, 'i') } // Case-insensitive check
        });

        if (exists) {
            return res.status(400).json({ success: false, message: 'Product with this name already exists' });
        }

        const product = await Product.create({
            company_id: req.user.restaurant_id,
            name,
            category,
            product_type,
            selling_price,
            purchase_price: product_type === 'TYPE_A' ? purchase_price : undefined,
            opening_stock: product_type === 'TYPE_A' ? opening_stock : 0,
            current_stock: product_type === 'TYPE_A' ? opening_stock : 0
        });

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Admin, Owner)
exports.updateProduct = async (req, res) => {
    try {
        let product = await Product.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Prevent changing product_type
        if (req.body.product_type && req.body.product_type !== product.product_type) {
            return res.status(400).json({ success: false, message: 'Product type cannot be changed once created' });
        }

        product = await Product.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle product active status (Disable/Enable)
// @route   PATCH /api/products/:id/toggle-status
// @access  Private (Admin, Owner)
exports.toggleProductStatus = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product.is_active = !product.is_active;
        await product.save();

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin, Owner)
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if any bills have this product
        const Bill = require('../models/Bill'); // Import here to avoid circular dependency
        const billItems = await Bill.findOne({
            "items.product_id": req.params.id
        });

        if (billItems) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete product because it has been used in bills' 
            });
        }

        await Product.deleteOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

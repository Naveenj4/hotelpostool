const Supplier = require('../models/Supplier');

// @desc    Get all suppliers for a restaurant
// @route   GET /api/suppliers
// @access  Public
exports.getSuppliers = async (req, res) => {
    try {
        const suppliers = await Supplier.find({ company_id: req.user.restaurant_id })
            .sort({ is_active: -1, name: 1 });
        res.status(200).json({ success: true, count: suppliers.length, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Admin/Owner
exports.createSupplier = async (req, res) => {
    try {
        const { name, contact_person, contact_number, email, gst_number, address, opening_balance } = req.body;

        const existingSupplier = await Supplier.findOne({
            company_id: req.user.restaurant_id,
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (existingSupplier) {
            return res.status(400).json({ success: false, error: 'Supplier already exists' });
        }

        const supplier = await Supplier.create({
            name,
            contact_person,
            contact_number,
            email,
            gst_number,
            address,
            opening_balance,
            company_id: req.user.restaurant_id
        });

        res.status(201).json({ success: true, data: supplier });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Admin/Owner
exports.updateSupplier = async (req, res) => {
    try {
        if (req.body.name) {
            const duplicate = await Supplier.findOne({
                company_id: req.user.restaurant_id,
                name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
                _id: { $ne: req.params.id }
            });
            if (duplicate) return res.status(400).json({ success: false, error: 'Supplier name already exists' });
        }

        const supplier = await Supplier.findOneAndUpdate(
            { _id: req.params.id, company_id: req.user.restaurant_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }

        res.status(200).json({ success: true, data: supplier });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Toggle supplier status
// @route   PATCH /api/suppliers/:id/toggle-status
// @access  Admin/Owner
exports.toggleSupplierStatus = async (req, res) => {
    try {
        const supplier = await Supplier.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }

        supplier.is_active = !supplier.is_active;
        await supplier.save();

        res.status(200).json({ success: true, data: supplier });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Admin/Owner
exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        if (!supplier) {
            return res.status(404).json({ success: false, error: 'Supplier not found' });
        }

        // Future check: ensure supplier doesn't have active purchase bills or ledgers before deleting 
        // For now, allow soft delete / status toggle or hard delete.

        await Supplier.deleteOne({ _id: req.params.id, company_id: req.user.restaurant_id });

        res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

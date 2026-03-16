const Kitchen = require('../models/Kitchen');
const Bill = require('../models/Bill');

// GET /api/kitchens — list all kitchens for this company
exports.getKitchens = async (req, res) => {
    try {
        const kitchens = await Kitchen.find({ company_id: req.user.restaurant_id }).sort({ name: 1 });
        res.status(200).json({ success: true, data: kitchens });
    } catch (error) {
        console.error('getKitchens error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// POST /api/kitchens — create a kitchen
exports.createKitchen = async (req, res) => {
    try {
        const { name, description, categories, color } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'Kitchen name is required' });
        }

        const kitchen = await Kitchen.create({
            company_id: req.user.restaurant_id,
            name: name.trim(),
            description: description || '',
            categories: categories || [],
            color: color || '#6c5fc7'
        });

        res.status(201).json({ success: true, data: kitchen });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: 'A kitchen with this name already exists' });
        }
        console.error('createKitchen error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// PUT /api/kitchens/:id — update a kitchen
exports.updateKitchen = async (req, res) => {
    try {
        const { name, description, categories, color, is_active } = req.body;
        const kitchen = await Kitchen.findOneAndUpdate(
            { _id: req.params.id, company_id: req.user.restaurant_id },
            { name, description, categories, color, is_active },
            { new: true, runValidators: true }
        );
        if (!kitchen) return res.status(404).json({ success: false, error: 'Kitchen not found' });
        res.status(200).json({ success: true, data: kitchen });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, error: 'A kitchen with this name already exists' });
        }
        console.error('updateKitchen error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// DELETE /api/kitchens/:id — delete a kitchen
exports.deleteKitchen = async (req, res) => {
    try {
        const kitchen = await Kitchen.findOneAndDelete({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!kitchen) return res.status(404).json({ success: false, error: 'Kitchen not found' });
        res.status(200).json({ success: true, message: 'Kitchen deleted' });
    } catch (error) {
        console.error('deleteKitchen error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// GET /api/kitchens/:id/orders — get all OPEN bills whose items match this kitchen's categories
exports.getKitchenOrders = async (req, res) => {
    try {
        const kitchen = await Kitchen.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!kitchen) return res.status(404).json({ success: false, error: 'Kitchen not found' });

        // Show only OPEN bills that haven't been marked READY/SERVED in the kitchen yet
        const bills = await Bill.find({
            company_id: req.user.restaurant_id,
            status: 'OPEN',
            kitchen_status: 'PENDING',
            'items.0': { $exists: true } // at least 1 item
        }).sort({ createdAt: 1 });

        // Filter bill items to only those belonging to this kitchen's categories
        // If kitchen has no categories assigned, show ALL items (catch-all kitchen)
        const result = bills.map(bill => {
            let relevantItems;
            if (kitchen.categories && kitchen.categories.length > 0) {
                relevantItems = bill.items.filter(item =>
                    kitchen.categories.includes(item.category)
                );
            } else {
                relevantItems = bill.items;
            }

            if (relevantItems.length === 0) return null;

            return {
                _id: bill._id,
                bill_number: bill.bill_number,
                table_no: bill.table_no,
                order_mode: bill.type,
                customer_name: bill.customer_name,
                captain_name: bill.captain_name,
                waiter_name: bill.waiter_name,
                persons: bill.persons,
                createdAt: bill.createdAt,
                items: relevantItems
            };
        }).filter(Boolean);

        res.status(200).json({ success: true, data: result, kitchen });
    } catch (error) {
        console.error('getKitchenOrders error:', error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

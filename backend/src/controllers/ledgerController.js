const Ledger = require('../models/Ledger');

exports.getLedgers = async (req, res) => {
    try {
        const ledgers = await Ledger.find({ company_id: req.user.restaurant_id }).sort({ name: 1 });
        res.status(200).json({ success: true, count: ledgers.length, data: ledgers });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.createLedger = async (req, res) => {
    try {
        const { name } = req.body;
        const exists = await Ledger.findOne({ company_id: req.user.restaurant_id, name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (exists) return res.status(400).json({ success: false, error: 'Ledger already exists' });

        const ledger = await Ledger.create({ ...req.body, company_id: req.user.restaurant_id });
        res.status(201).json({ success: true, data: ledger });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateLedger = async (req, res) => {
    try {
        if (req.body.name) {
            const duplicate = await Ledger.findOne({
                company_id: req.user.restaurant_id,
                name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
                _id: { $ne: req.params.id }
            });
            if (duplicate) return res.status(400).json({ success: false, error: 'Ledger name already exists' });
        }
        const ledger = await Ledger.findOneAndUpdate({ _id: req.params.id, company_id: req.user.restaurant_id }, req.body, { new: true });
        if (!ledger) return res.status(404).json({ success: false, error: 'Ledger not found' });
        res.status(200).json({ success: true, data: ledger });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.toggleLedgerStatus = async (req, res) => {
    try {
        const ledger = await Ledger.findOne({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!ledger) return res.status(404).json({ success: false, error: 'Ledger not found' });
        ledger.is_active = !ledger.is_active;
        await ledger.save();
        res.status(200).json({ success: true, data: ledger });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.deleteLedger = async (req, res) => {
    try {
        const ledger = await Ledger.findOneAndDelete({ _id: req.params.id, company_id: req.user.restaurant_id });
        if (!ledger) return res.status(404).json({ success: false, error: 'Ledger not found' });
        res.status(200).json({ success: true, message: 'Ledger deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

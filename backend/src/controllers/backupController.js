const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

// For simplicity and to avoid dependency issues if archiver isn't there, 
// we'll implement a JSON-based backup for now.

exports.createBackup = async (req, res) => {
    try {
        const { backupPath } = req.body;
        const targetDir = backupPath || path.resolve(__dirname, '../../../backups');

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const collections = await mongoose.connection.db.listCollections().toArray();
        const backupData = {};

        for (const col of collections) {
            const data = await mongoose.connection.db.collection(col.name).find({}).toArray();
            backupData[col.name] = data;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${timestamp}.json`;
        const fullPath = path.join(targetDir, filename);

        // Check disk space (simple mock for node environment)
        // In a real local app, we'd use something like 'diskusage'
        
        fs.writeFileSync(fullPath, JSON.stringify(backupData, null, 2));

        res.status(200).json({
            success: true,
            message: 'Backup created successfully',
            data: {
                path: fullPath,
                filename: filename
            }
        });
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.restoreBackup = async (req, res) => {
    try {
        // This would handle uploading a file and restoring it
        // For now, we'll placeholder it as the frontend will send the file content
        const { backupData } = req.body;

        if (!backupData) {
            return res.status(400).json({ success: false, message: 'No backup data provided' });
        }

        for (const colName in backupData) {
            await mongoose.connection.db.collection(colName).deleteMany({});
            if (backupData[colName].length > 0) {
                // Convert string IDs back to ObjectIDs? 
                // MongoDB JSON export usually handles this, but we'll try to be safe
                const docs = backupData[colName].map(doc => {
                    const newDoc = { ...doc };
                    if (newDoc._id) newDoc._id = new mongoose.Types.ObjectId(newDoc._id);
                    return newDoc;
                });
                await mongoose.connection.db.collection(colName).insertMany(docs);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Data restored successfully'
        });
    } catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

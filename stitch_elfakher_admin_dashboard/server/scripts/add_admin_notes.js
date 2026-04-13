const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query } = require('../config/database');

async function migrate() {
    try {
        console.log('Starting migration: Add admin_notes column');

        await query(`
            ALTER TABLE orders.orders 
            ADD COLUMN IF NOT EXISTS admin_notes TEXT;
        `);

        console.log('✓ Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('✗ Migration failed:', error);
        process.exit(1);
    }
}

migrate();

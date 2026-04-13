const { query, pool } = require('../config/database');

async function migrate() {
    try {
        console.log('🔄 Starting migration...');

        // 1. Add fabric_id column
        console.log('➕ Adding fabric_id column...');
        await query(`
            ALTER TABLE orders.order_items 
            ADD COLUMN IF NOT EXISTS fabric_id UUID REFERENCES catalog.fabrics(id) ON DELETE SET NULL;
        `);

        // 2. Drop NOT NULL constraint on product_id
        console.log('🔓 Dropping NOT NULL on product_id...');
        await query(`
            ALTER TABLE orders.order_items 
            ALTER COLUMN product_id DROP NOT NULL;
        `);

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        pool.end();
    }
}

migrate();

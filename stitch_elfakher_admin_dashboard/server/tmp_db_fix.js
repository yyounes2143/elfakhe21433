require('dotenv').config();
const { query } = require('./config/database');

async function fixEnum() {
    try {
        console.log('Starting enum replacement...');
        console.log('Updating existing rows...');
        await query(`UPDATE orders.orders SET status = 'pending' WHERE status = 'processing';`);
        await query(`UPDATE orders.order_status_history SET old_status = 'pending' WHERE old_status = 'processing';`);
        await query(`UPDATE orders.order_status_history SET new_status = 'pending' WHERE new_status = 'processing';`);
        
        console.log('Renaming old enum type...');
        await query(`ALTER TYPE orders.order_status RENAME TO order_status_old;`);
        
        console.log('Creating new enum type...');
        await query(`
        CREATE TYPE orders.order_status AS ENUM (
            'pending',
            'confirmed',
            'shipped',
            'delivered',
            'cancelled',
            'returned'
        );`);
        
        console.log('Migrating orders table columns...');
        await query(`ALTER TABLE orders.orders ALTER COLUMN status DROP DEFAULT;`);
        await query(`ALTER TABLE orders.orders ALTER COLUMN status TYPE orders.order_status USING status::text::orders.order_status;`);
        await query(`ALTER TABLE orders.orders ALTER COLUMN status SET DEFAULT 'pending';`);
        
        console.log('Migrating order history columns...');
        await query(`ALTER TABLE orders.order_status_history ALTER COLUMN old_status TYPE orders.order_status USING old_status::text::orders.order_status;`);
        await query(`ALTER TABLE orders.order_status_history ALTER COLUMN new_status TYPE orders.order_status USING new_status::text::orders.order_status;`);
        
        console.log('Dropping old enum type...');
        await query(`DROP TYPE orders.order_status_old;`);
        
        console.log('\n✅ Enum "processing" successfully removed from database.');
    } catch(err) {
        console.error('❌ Migration failed:', err);
    }
    process.exit(0);
}

fixEnum();

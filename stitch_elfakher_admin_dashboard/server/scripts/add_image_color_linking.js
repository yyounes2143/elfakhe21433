/**
 * Migration: Add image_color_mapping column to products table
 * Note: The images column already stores objects with {url, color} when linking is enabled
 * This column stores the state of whether image-color linking is enabled
 */
const { pool } = require('../config/database');

async function migrate() {
    try {
        await pool.query(`
            ALTER TABLE catalog.products 
            ADD COLUMN IF NOT EXISTS image_color_linking_enabled BOOLEAN DEFAULT false
        `);
        console.log('✓ Added image_color_linking_enabled column to catalog.products');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();

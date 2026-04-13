/**
 * Migration: Add size_color_availability column to products table
 * Stores which colors are available for which sizes: { "size_uuid": ["color_uuid1", "color_uuid2"] }
 */
const { pool } = require('../config/database');

async function migrate() {
    try {
        await pool.query(`
            ALTER TABLE catalog.products 
            ADD COLUMN IF NOT EXISTS size_color_availability JSONB DEFAULT '{}'::jsonb
        `);
        console.log('✓ Added size_color_availability column to catalog.products');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();

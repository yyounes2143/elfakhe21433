/**
 * Script to add image_url column to colors table
 * إضافة حقل صورة للون في قاعدة البيانات
 */

const db = require('../config/database');

async function addColorImageColumn() {
    try {
        console.log('Checking if image_url column exists in colors table...');

        // Check if column exists
        const checkColumn = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'catalog' 
            AND table_name = 'colors' 
            AND column_name = 'image_url'
        `);

        if (checkColumn.rows.length === 0) {
            console.log('Adding image_url column to colors table...');

            await db.query(`
                ALTER TABLE catalog.colors 
                ADD COLUMN image_url VARCHAR(500)
            `);

            console.log('✅ image_url column added successfully!');
        } else {
            console.log('✅ image_url column already exists.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addColorImageColumn();

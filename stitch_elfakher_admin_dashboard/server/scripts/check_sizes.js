/**
 * Debug: Check sizes in database and product data
 */
const { pool } = require('../config/database');

async function checkSizes() {
    try {
        // Check standard_sizes table
        console.log('=== catalog.standard_sizes ===');
        const sizes = await pool.query('SELECT * FROM catalog.standard_sizes ORDER BY size_number');
        console.log('Sizes in DB:', sizes.rows);

        // Check a product's available_size_ids
        console.log('\n=== Recent Product Size Data ===');
        const products = await pool.query(`
            SELECT id, name_ar, available_size_ids, available_color_ids, embedded_colors 
            FROM catalog.products 
            ORDER BY created_at DESC 
            LIMIT 3
        `);
        products.rows.forEach((p, i) => {
            console.log(`\nProduct ${i + 1}: ${p.name_ar}`);
            console.log('  available_size_ids:', p.available_size_ids);
            console.log('  available_color_ids:', p.available_color_ids);
            console.log('  embedded_colors:', p.embedded_colors);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkSizes();

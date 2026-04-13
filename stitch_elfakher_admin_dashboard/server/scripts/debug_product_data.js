const { pool } = require('../config/database');

async function debugData() {
    try {
        console.log('--- Checking catalog.colors ---');
        const colors = await pool.query('SELECT * FROM catalog.colors LIMIT 5');
        console.log('Colors (first 5):', colors.rows);

        console.log('\n--- Checking catalog.standard_sizes ---');
        const sizes = await pool.query('SELECT * FROM catalog.standard_sizes LIMIT 5');
        console.log('Sizes (first 5):', sizes.rows);

        console.log('\n--- Checking catalog.products (Sample) ---');
        const product = await pool.query(`
            SELECT id, name_ar, available_color_ids, available_size_ids 
            FROM catalog.products 
            LIMIT 1
        `);
        console.log('Sample Product:', product.rows[0]);

        if (product.rows.length > 0) {
            const p = product.rows[0];
            const colorIds = p.available_color_ids || [];
            const sizeIds = p.available_size_ids || [];

            console.log('\n--- Verifying Relations for Sample Product ---');
            if (colorIds.length > 0) {
                const matchedColors = await pool.query('SELECT * FROM catalog.colors WHERE id = ANY($1)', [colorIds]);
                console.log(`Matched Colors (${colorIds.length} IDs):`, matchedColors.rows.length, 'found');
            } else {
                console.log('Product has no color IDs');
            }

            if (sizeIds.length > 0) {
                const matchedSizes = await pool.query('SELECT * FROM catalog.standard_sizes WHERE id = ANY($1)', [sizeIds]);
                console.log(`Matched Sizes (${sizeIds.length} IDs):`, matchedSizes.rows.length, 'found');
            } else {
                console.log('Product has no size IDs');
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

debugData();

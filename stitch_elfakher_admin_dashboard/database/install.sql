-- =============================================
-- ELFAKHER - Full Database Installation Script
-- تشغيل هذا الملف لإنشاء قاعدة البيانات كاملة
-- =============================================

-- ملاحظة: قم بتنفيذ هذه الأوامر بالترتيب

-- 1. إنشاء قاعدة البيانات
-- CREATE DATABASE elfakher_db WITH ENCODING 'UTF8';

-- 2. الاتصال بقاعدة البيانات
-- \c elfakher_db

-- 3. تنفيذ الملفات بالترتيب:
\echo '>>> Creating schemas and types...'
\i schema.sql

\echo '>>> Creating core tables...'
\i tables/core.sql

\echo '>>> Creating catalog tables...'
\i tables/catalog.sql

\echo '>>> Creating shipping tables...'
\i tables/shipping.sql

\echo '>>> Creating orders tables...'
\i tables/orders.sql

\echo '>>> Seeding wilayas data...'
\i seeds/wilayas.sql

\echo '>>> Creating views and functions...'
\i views_functions.sql

\echo '>>> Database installation complete!'

-- =============================================
-- أو يمكنك نسخ محتوى الملفات بالترتيب التالي:
-- 1. schema.sql
-- 2. tables/core.sql
-- 3. tables/catalog.sql  
-- 4. tables/shipping.sql
-- 5. tables/orders.sql
-- 6. seeds/wilayas.sql
-- 7. views_functions.sql
-- =============================================

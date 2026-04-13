/**
 * ELFAKHER Admin API - Main Server
 * السيرفر الرئيسي للـ API
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================================
// Middleware
// ===============================================
// تفعيل حماية ترويسات HTTP
app.use(helmet({
    contentSecurityPolicy: false, // تعطيل CSP مؤقتاً لتجنب كسر الواجهة الأمامية إذا كانت تستخدم سكريبتات خارجية
}));

// الحد من الطلبات لمنع هجمات التخمين (DDoS / Brute Force)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100, // حد أقصى 100 طلب لكل أي بي في كل 15 دقيقة
    message: { success: false, message: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً' }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files - serve frontend
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
app.use('/css', express.static(path.join(__dirname, '..', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'js')));
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// ===============================================
// API Routes
// ===============================================
const authRoutes = require('./routes/auth');
const customersRoutes = require('./routes/customers');
const ordersRoutes = require('./routes/orders');
const productsRoutes = require('./routes/products');
const statsRoutes = require('./routes/stats');
const settingsRoutes = require('./routes/settings');
const { authMiddleware } = require('./middleware/auth');

// مسار المصادقة (مفتوح للجميع)
app.use('/api/auth', apiLimiter, authRoutes);

// مسارات الإدارة المحمية
app.use('/api/customers', authMiddleware, customersRoutes);
app.use('/api/stats', authMiddleware, statsRoutes);

// مسارات مختلطة (عامة ومحمية) - يتم تطبيق حماية authMiddleware داخل ملفات المسارات للأدمن فقط
app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/settings', settingsRoutes);

// ===============================================
// Root redirect to admin
// ===============================================
app.get('/', (req, res) => {
    res.redirect('/admin/index.html');
});

// ===============================================
// Error handling
// ===============================================
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'حدث خطأ في السيرفر',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'المسار غير موجود'
    });
});

// ===============================================
// Start Server
// ===============================================
app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════╗');
    console.log('║   ELFAKHER Admin API Server            ║');
    console.log('╠════════════════════════════════════════╣');
    console.log(`║   🚀 Server running on port ${PORT}        ║`);
    console.log(`║   📍 http://localhost:${PORT}             ║`);
    console.log(`║   📊 Admin: http://localhost:${PORT}/admin ║`);
    console.log('╚════════════════════════════════════════╝');
    console.log('');
});

module.exports = app;

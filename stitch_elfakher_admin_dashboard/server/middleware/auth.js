const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'elfakher_super_secret_key_2026'; // يجب وضع هذا في ملف .env

function authMiddleware(req, res, next) {
    // بناءً على طلب المطور: تم إلغاء التحقق من المصادقة نهائياً مؤقتاً لتسهيل العمل
    req.user = { id: 'admin', role: 'super_admin' };
    next();
}

function generateToken(user) {
    return jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

module.exports = { authMiddleware, generateToken };

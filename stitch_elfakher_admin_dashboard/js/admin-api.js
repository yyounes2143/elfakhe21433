/**
 * ELFAKHER Admin - API Client
 * عميل API للتعامل مع الباك اند
 */

const API_BASE = '/api';

// ===============================================
// API Client
// ===============================================
const api = {
    /**
     * Helper function for fetch requests
     */
    async fetch(endpoint, options = {}) {
        try {
            const token = localStorage.getItem('elfakher_token');
            const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'حدث خطأ في العملية');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // ===== Customers API =====
    async getCustomers(page = 1, limit = 10, search = '') {
        const params = new URLSearchParams({ page, limit });
        if (search) params.append('search', search);
        return this.fetch(`/customers?${params}`);
    },

    async getCustomer(id) {
        return this.fetch(`/customers/${id}`);
    },

    async getCustomerStats() {
        return this.fetch('/customers/stats');
    },

    // ===== Orders API =====
    async getOrders(page = 1, limit = 10, status = '', search = '') {
        const params = new URLSearchParams({ page, limit });
        if (status) params.append('status', status);
        if (search) params.append('search', search);
        return this.fetch(`/orders?${params}`);
    },

    async getOrder(id) {
        return this.fetch(`/orders/${id}`);
    },

    async getOrderStats() {
        return this.fetch('/orders/stats');
    },

    async updateOrderStatus(id, status) {
        return this.fetch(`/orders/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    },

    async updateAdminNotes(id, notes) {
        return this.fetch(`/orders/${id}/notes`, {
            method: 'PATCH',
            body: JSON.stringify({ notes })
        });
    },

    // ===== Products API =====
    async getProducts(page = 1, limit = 12, category = '', status = '', search = '') {
        const params = new URLSearchParams({ page, limit });
        if (category) params.append('category', category);
        if (status) params.append('status', status);
        if (search) params.append('search', search);
        return this.fetch(`/products?${params}`);
    },

    async getProduct(id) {
        return this.fetch(`/products/${id}`);
    },

    async getProductStats() {
        return this.fetch('/products/stats');
    },

    async getCategories() {
        return this.fetch('/products/categories');
    },

    // ===== Dashboard Stats =====
    async getDashboardStats() {
        return this.fetch('/stats/dashboard');
    },

    async getWilayas() {
        return this.fetch('/stats/wilayas');
    }
};

// ===============================================
// UI Helpers
// ===============================================
const ui = {
    /**
     * Format price in DZD
     */
    formatPrice(price) {
        return new Intl.NumberFormat('ar-DZ').format(price) + ' دج';
    },

    /**
     * Format date
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-DZ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },

    /**
     * Get status badge HTML
     */
    getStatusBadge(status) {
        const statusMap = {
            'pending': { class: 'pending', text: 'قيد الانتظار' },
            'confirmed': { class: 'processing', text: 'تم التأكيد' },
            'processing': { class: 'processing', text: 'قيد التجهيز' },
            'shipped': { class: 'shipped', text: 'تم الشحن' },
            'delivered': { class: 'delivered', text: 'تم التسليم' },
            'cancelled': { class: 'pending', text: 'ملغي' },
            'returned': { class: 'pending', text: 'مرتجع' }
        };
        const s = statusMap[status] || { class: 'pending', text: status };
        return `<span class="status-badge ${s.class}">${s.text}</span>`;
    },

    /**
     * Get initials from name
     */
    getInitials(name) {
        if (!name) return '؟';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return parts[0].charAt(0) + parts[1].charAt(0);
        }
        return name.substring(0, 2);
    },

    /**
     * Generate random avatar color
     */
    getAvatarColor(name) {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        const index = name ? name.charCodeAt(0) % colors.length : 0;
        return colors[index];
    },

    /**
     * Show loading state
     */
    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <tr><td colspan="7" style="text-align:center;padding:3rem;">
                    <span class="material-icons-outlined" style="font-size:2rem;color:var(--admin-muted);animation:spin 1s linear infinite;">sync</span>
                    <p style="color:var(--admin-muted);margin-top:0.5rem;">جاري التحميل...</p>
                </td></tr>
            `;
        }
    },

    /**
     * Show error state
     */
    showError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <tr><td colspan="7" style="text-align:center;padding:3rem;">
                    <span class="material-icons-outlined" style="font-size:2rem;color:#EF4444;">error_outline</span>
                    <p style="color:var(--admin-muted);margin-top:0.5rem;">${message}</p>
                    <button onclick="location.reload()" class="btn-admin btn-admin-outline" style="margin-top:1rem;">
                        <span class="material-icons-outlined">refresh</span> إعادة المحاولة
                    </button>
                </td></tr>
            `;
        }
    },

    /**
     * Show empty state
     */
    showEmpty(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <tr><td colspan="7" style="text-align:center;padding:3rem;">
                    <span class="material-icons-outlined" style="font-size:2rem;color:var(--admin-muted);">inbox</span>
                    <p style="color:var(--admin-muted);margin-top:0.5rem;">${message}</p>
                </td></tr>
            `;
        }
    }
};

// ===============================================
// Page-specific loaders
// ===============================================

/**
 * Load customers into table
 */
async function loadCustomers(page = 1) {
    const tbody = document.getElementById('customers-table-body');
    if (!tbody) return;

    ui.showLoading('customers-table-body');

    try {
        const searchInput = document.querySelector('.search-input');
        const search = searchInput ? searchInput.value : '';

        const response = await api.getCustomers(page, 10, search);

        if (response.data.length === 0) {
            ui.showEmpty('customers-table-body', 'لا يوجد عملاء');
            return;
        }

        tbody.innerHTML = response.data.map(customer => `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        <div style="width:2.5rem;height:2.5rem;background:${ui.getAvatarColor(customer.full_name)};border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:600;">
                            ${ui.getInitials(customer.full_name)}
                        </div>
                        <div>
                            <strong>${customer.full_name || '-'}</strong>
                            <p style="font-size:0.75rem;color:var(--admin-muted);">${customer.email || ''}</p>
                        </div>
                    </div>
                </td>
                <td data-label="الهاتف:">${customer.phone || '-'}</td>
                <td data-label="الولاية:">${customer.wilaya_code || '-'}</td>
                <td data-label="الطلبات:"><span class="status-badge delivered">${customer.total_orders || 0} طلب</span></td>
                <td data-label="المشتريات:"><strong>${ui.formatPrice(customer.total_spent || 0)}</strong></td>
                <td data-label="آخر طلب:">${ui.formatDate(customer.last_order_date)}</td>
                <td>
                    <button class="btn-admin-icon" onclick="viewCustomer('${customer.id}')">
                        <span class="material-icons-outlined">visibility</span>
                    </button>
                    <button class="btn-admin-icon">
                        <span class="material-icons-outlined">chat</span>
                    </button>
                </td>
            </tr>
        `).join('');

        // Update pagination info
        updatePagination(response.pagination, 'customers');

        // Load stats
        loadCustomerStats();
    } catch (error) {
        ui.showError('customers-table-body', 'فشل في تحميل العملاء: ' + error.message);
    }
}

/**
 * Load customer stats
 */
async function loadCustomerStats() {
    try {
        const response = await api.getCustomerStats();
        const stats = response.data;

        const elements = {
            'stat-total-customers': stats.totalCustomers,
            'stat-new-customers': stats.newThisMonth,
            'stat-returning-customers': stats.returningCustomers,
            'stat-avg-order-value': ui.formatPrice(stats.avgOrderValue)
        };

        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.textContent = typeof value === 'number' ? value.toLocaleString('ar-DZ') : value;
        }
    } catch (error) {
        console.error('Error loading customer stats:', error);
    }
}

/**
 * Load orders into table
 */
async function loadOrders(page = 1) {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    ui.showLoading('orders-table-body');

    try {
        const statusFilter = document.getElementById('status-filter');
        const searchInput = document.querySelector('.search-input');
        const status = statusFilter ? statusFilter.value : '';
        const search = searchInput ? searchInput.value : '';

        const response = await api.getOrders(page, 10, status, search);

        if (response.data.length === 0) {
            ui.showEmpty('orders-table-body', 'لا توجد طلبات');
            const pagesEl = document.getElementById('orders-pages');
            const countEl = document.getElementById('orders-count');
            if (pagesEl) pagesEl.innerHTML = '';
            if (countEl) countEl.textContent = '';
            return;
        }

        tbody.innerHTML = response.data.map(order => `
            <tr>
                <td data-label="رقم الطلب:"><strong>#${order.order_number}</strong></td>
                <td data-label="العميل:">${order.customer_name || '-'}</td>
                <td data-label="المنتجات:">${order.items_count || 0} منتج</td>
                <td data-label="المبلغ:"><strong>${ui.formatPrice(order.total_amount || 0)}</strong></td>
                <td data-label="الحالة:">${ui.getStatusBadge(order.status)}</td>
                <td data-label="التاريخ:">${ui.formatDate(order.created_at)}</td>
                <td>
                    <button class="btn-admin-icon" onclick="viewOrder('${order.id}')" title="عرض التفاصيل">
                        <span class="material-icons-outlined">visibility</span>
                    </button>
                    <div class="dropdown" style="display:inline-block;">
                        <button class="btn-admin-icon dropdown-toggle" title="تغيير الحالة">
                            <span class="material-icons-outlined">more_vert</span>
                        </button>
                        <div class="dropdown-menu">
                            <a href="#" onclick="event.preventDefault(); updateOrderStatus('${order.id}', 'confirmed')">✓ تأكيد</a>                            <a href="#" onclick="event.preventDefault(); updateOrderStatus('${order.id}', 'shipped')">📦 تم الشحن</a>
                            <a href="#" onclick="event.preventDefault(); updateOrderStatus('${order.id}', 'delivered')">✔ تم التسليم</a>
                            <hr>
                            <a href="#" onclick="event.preventDefault(); updateOrderStatus('${order.id}', 'cancelled')" style="color:#EF4444;">✖ إلغاء</a>
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');

        updatePagination(response.pagination, 'orders');
        loadOrderStats();
    } catch (error) {
        ui.showError('orders-table-body', 'فشل في تحميل الطلبات: ' + error.message);
    }
}

/**
 * Load order stats
 */
async function loadOrderStats() {
    try {
        const response = await api.getOrderStats();
        const stats = response.data;

        const elements = {
            'stat-total-orders': stats.totalOrders,
            'stat-pending-orders': stats.pendingOrders,
            'stat-in-progress': stats.inProgress,
            'stat-delivered-orders': stats.deliveredOrders
        };

        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el && value !== null && value !== undefined) {
                el.textContent = Number(value).toLocaleString('ar-DZ');
            } else if (el) {
                el.textContent = '0';
            }
        }
    } catch (error) {
        console.error('Error loading order stats:', error);
    }
}

/**
 * Load products into grid
 */
async function loadProducts(page = 1) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--admin-muted);">جاري التحميل...</p>';

    try {
        const categoryFilter = document.getElementById('category-filter');
        const searchInput = document.querySelector('.search-input');
        const category = categoryFilter ? categoryFilter.value : '';
        const search = searchInput ? searchInput.value : '';

        const response = await api.getProducts(page, 12, category, '', search);

        if (response.data.length === 0) {
            grid.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--admin-muted);">لا توجد منتجات</p>';
            return;
        }

        grid.innerHTML = response.data.map(product => {
            const image = (product.images && product.images.length > 0) ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url) : "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3e%3crect fill='%23f1f5f9' width='300' height='300'/%3e%3ctext fill='%2364748b' font-family='sans-serif' font-size='24' dy='10.5' font-weight='500' x='50%25' y='50%25' text-anchor='middle'%3eNo Image%3c/text%3e%3c/svg%3e";
            const statusBadge = product.status === 'active' ?
                '<span class="product-badge active">نشط</span>' :
                '<span class="product-badge draft">مسودة</span>';

            return `
                <div class="product-admin-card">
                    <div class="product-admin-image">
                        <img src="${image}" alt="${product.name_ar}">
                        ${statusBadge}
                    </div>
                    <div class="product-admin-info">
                        <h3 class="product-admin-title">${product.name_ar}</h3>
                        <div class="product-admin-price">${ui.formatPrice(product.sale_price || product.base_price)}</div>
                        <div class="product-admin-meta">
                            <span><span class="material-icons-outlined" style="font-size:14px;">category</span> ${product.category_name || '-'}</span>
                            <span><span class="material-icons-outlined" style="font-size:14px;">shopping_cart</span> ${product.order_count || 0} مبيعات</span>
                        </div>
                        <div class="product-admin-actions">
                            <button class="btn-admin btn-admin-outline" style="flex:1;" onclick="editProduct('${product.id}')">
                                <span class="material-icons-outlined">edit</span> تعديل
                            </button>
                            <button class="btn-admin-icon" style="color:#EF4444;">
                                <span class="material-icons-outlined">delete</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        loadProductStats();
    } catch (error) {
        grid.innerHTML = `<p style="text-align:center;padding:2rem;color:#EF4444;">فشل في تحميل المنتجات: ${error.message}</p>`;
    }
}

/**
 * Load product stats
 */
async function loadProductStats() {
    try {
        const response = await api.getProductStats();
        const stats = response.data;

        const elements = {
            'stat-total-products': stats.totalProducts,
            'stat-active-products': stats.activeProducts,
            'stat-draft-products': stats.draftProducts,
            'stat-out-of-stock': stats.outOfStock
        };

        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.textContent = value.toLocaleString('ar-DZ');
        }
    } catch (error) {
        console.error('Error loading product stats:', error);
    }
}

/**
 * Load dashboard stats
 */
async function loadDashboardStats() {
    try {
        const response = await api.getDashboardStats();
        const data = response.data;

        // Update stat cards
        const elements = {
            'stat-total-revenue': ui.formatPrice(data.revenue.total),
            'stat-month-revenue': ui.formatPrice(data.revenue.thisMonth),
            'stat-total-orders': data.orders.total,
            'stat-pending-orders': data.orders.pending,
            'stat-total-customers': data.customers.total,
            'stat-total-products': data.products.active
        };

        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.textContent = typeof value === 'number' ? value.toLocaleString('ar-DZ') : value;
        }

        // Load recent orders
        const recentOrdersContainer = document.getElementById('recent-orders');
        if (recentOrdersContainer && data.recentOrders) {
            if (data.recentOrders.length === 0) {
                recentOrdersContainer.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:1rem;color:var(--admin-muted);">لا توجد طلبات حديثة</td></tr>';
            } else {
                recentOrdersContainer.innerHTML = data.recentOrders.map(order => `
                    <tr>
                        <td data-label="رقم الطلب"><strong>#${order.order_number}</strong></td>
                        <td data-label="العميل">${order.customer_name || '-'}</td>
                        <td data-label="المبلغ"><strong>${ui.formatPrice(order.total_amount)}</strong></td>
                        <td data-label="الحالة">${ui.getStatusBadge(order.status)}</td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

/**
 * Update pagination UI - dynamic
 */
function updatePagination(pagination, type) {
    const countEl = document.getElementById(`${type}-count`);
    const pagesEl = document.getElementById(`${type}-pages`);

    if (countEl && pagination.total !== undefined && pagination.total !== null) {
        const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
        const end = Math.min(pagination.page * pagination.limit, pagination.total);
        countEl.textContent = `عرض ${start}-${end} من ${Number(pagination.total).toLocaleString('ar-DZ')} طلب`;
    }

    if (pagesEl) {
        const totalPages = pagination.totalPages || 1;
        const currentPage = pagination.page;

        // Determine which loader to use
        const loaderFn = type === 'orders' ? 'loadOrders' : type === 'customers' ? 'loadCustomers' : 'loadProducts';

        let html = '';

        // Previous button (chevron_right because RTL)
        html += `<button class="btn-admin-icon" ${currentPage <= 1 ? 'disabled style="opacity:0.3;pointer-events:none;"' : ''} onclick="${loaderFn}(${currentPage - 1})">
            <span class="material-icons-outlined">chevron_right</span>
        </button>`;

        // Page numbers - show max 5 pages around current
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) {
                html += `<button class="btn-admin btn-admin-primary" style="padding:0.5rem 0.875rem;">${i}</button>`;
            } else {
                html += `<button class="btn-admin btn-admin-outline" style="padding:0.5rem 0.875rem;" onclick="${loaderFn}(${i})">${i}</button>`;
            }
        }

        // Next button (chevron_left because RTL)
        html += `<button class="btn-admin-icon" ${currentPage >= totalPages ? 'disabled style="opacity:0.3;pointer-events:none;"' : ''} onclick="${loaderFn}(${currentPage + 1})">
            <span class="material-icons-outlined">chevron_left</span>
        </button>`;

        pagesEl.innerHTML = html;
    }
}

/**
 * View customer details
 */
function viewCustomer(id) {
    // TODO: Implement modal or navigate to detail page
    console.log('View customer:', id);
    showNotification('جاري فتح تفاصيل العميل...');
}

// Store current order ID for modal actions
let currentOrderId = null;

/**
 * View order details
 */
async function viewOrder(id) {
    console.log('Viewing order:', id);
    currentOrderId = id; // Store for later use by dropdown
    const modal = document.getElementById('orderDetailsModal');

    try {
        // Show loading state (optional) or just open if fast

        // Fetch order details
        const response = await api.getOrder(id);
        const order = response.data;

        // 1. Populate Header
        const orderNumEl = document.getElementById('modalOrderNumber');
        if (orderNumEl) orderNumEl.textContent = `#${order.order_number}`;

        // 2. Populate Customer Info
        const custName = document.getElementById('customerName');
        if (custName) custName.textContent = order.customer_name || 'غير معروف';

        const custPhone = document.getElementById('customerPhone');
        if (custPhone) custPhone.textContent = order.customer_phone || '-';

        const phoneLink = document.getElementById('customerPhoneLink');
        if (phoneLink) {
            if (order.customer_phone) {
                phoneLink.href = `tel:${order.customer_phone}`;
                phoneLink.style.display = 'inline-flex';
            } else {
                phoneLink.style.display = 'none';
            }
        }

        const custWilaya = document.getElementById('customerWilaya');
        if (custWilaya) custWilaya.textContent = order.wilaya_name || order.wilaya_code || '-';

        // 3. Populate Order Info
        const orderDate = document.getElementById('orderDate');
        if (orderDate) orderDate.textContent = ui.formatDate(order.created_at) + ' - ' + new Date(order.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });

        const orderStatus = document.getElementById('orderStatusBadge');
        if (orderStatus) orderStatus.innerHTML = ui.getStatusBadge(order.status);

        // 4. Update Timeline and Select
        updateOrderTimeline(order.status);
        const statusSelect = document.getElementById('orderStatusSelect');
        if (statusSelect) statusSelect.value = order.status;

        // 5. Populate Items
        const itemsBody = document.getElementById('order-items-table-body');
        if (itemsBody) {
            if (order.items && order.items.length > 0) {
                itemsBody.innerHTML = order.items.map(item => {
                    let imageHtml = '';
                    let detailsHtml = '';

                    if (item.product_type === 'fabric') {
                        // Fabric Item
                        const image = item.image_url || '../assets/placeholder-fabric.png';
                        // Use style for background image to handle scaling better for swatches
                        imageHtml = `<div class="fabric-swatch" style="background-image:url('${image}');"></div>`;

                        detailsHtml = `
                            <div class="item-meta">
                                نوع القماش: ${item.fabric_type || '-'}<br>
                                اللون: ${item.color_name || '-'}<br>
                                الأمتار: ${item.quantity} متر
                            </div>
                        `;
                    } else {
                        // Product Item
                        const image = item.image_url || "data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3e%3crect fill='%23f1f5f9' width='100' height='100'/%3e%3ctext fill='%2364748b' font-family='sans-serif' font-size='12' dy='4' font-weight='500' x='50%25' y='50%25' text-anchor='middle'%3eNo Image%3c/text%3e%3c/svg%3e";
                        imageHtml = `<img src="${image}" class="product-thumbnail" alt="${item.product_name}">`;

                        // Parse customization if it's a string
                        let customization = item.customization;
                        if (typeof customization === 'string') {
                            try { customization = JSON.parse(customization); } catch (e) { }
                        }

                        let customHtml = '';
                        if (customization) {
                            if (customization.collar) customHtml += `الكول: ${customization.collar}<br>`;
                            if (customization.sleeve) customHtml += `الأكمام: ${customization.sleeve}<br>`;
                            if (customization.closure) customHtml += `الكبسة: ${customization.closure}<br>`;
                        }

                        let colorHtml = item.color_name || '-';
                        if (item.hex_code) {
                            colorHtml = `
                                <div style="display:flex;align-items:center;gap:0.25rem;">
                                    <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background-color:${item.hex_code};border:1px solid #ddd;"></span>
                                    <span>${item.color_name}</span>
                                </div>
                            `;
                        }

                        detailsHtml = `
                            <div class="item-meta">
                                 المقاس: ${item.size || '-'}<br>
                                 <div style="display:flex;align-items:center;gap:0.25rem;">
                                     اللون: ${colorHtml}
                                 </div>
                                 ${customHtml}
                            </div>
                        `;
                    }

                    if (item.product_id) {
                        const folder = item.product_type === 'fabric' ? 'fabrics' : 'products'; // Assuming simple link structure
                        // Actually public product page: product.html?id=ID
                        detailsHtml += `
                            <div style="margin-top:0.25rem;">
                                <a href="/public/product.html?id=${item.product_id}" target="_blank" style="font-size:0.75rem;color:var(--admin-accent);text-decoration:none;display:inline-flex;align-items:center;gap:0.25rem;">
                                    <span class="material-icons-outlined" style="font-size:14px;">visibility</span> عرض المنتج
                                </a>
                            </div>
                         `;
                    }

                    return `
                        <tr>
                            <td>
                                <div style="display:flex;gap:0.75rem;align-items:center;">
                                    ${imageHtml}
                                    <div>
                                        <strong>${item.product_name}</strong>
                                    </div>
                                </div>
                            </td>
                            <td>${detailsHtml}</td>
                            <td>${item.quantity}</td>
                            <td><strong>${ui.formatPrice(item.total_price)}</strong></td>
                            <td>
                                <button class="btn-admin-icon" style="color:var(--admin-danger);" onclick="removeOrderItem('${order.id}', '${item.id}')" title="حذف المنتج من الطلب">
                                    <span class="material-icons-outlined">delete</span>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            } else {
                itemsBody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:1rem;">لا توجد منتجات</td></tr>';
            }
        }

        // 6. Populate Summary
        const summaryBox = document.getElementById('order-summary');
        if (summaryBox) {
            const subtotal = order.total_amount;
            // For simple display, assuming total includes everything. 
            // If backend provides breakdown, use it.

            summaryBox.innerHTML = `
                <div class="summary-row"><span>المجموع:</span><span>${ui.formatPrice(subtotal)}</span></div>
                <div class="summary-row total"><span>الإجمالي:</span><span>${ui.formatPrice(subtotal)}</span></div>
            `;
        }

        // 7. Notes
        const orderNotes = document.getElementById('orderNotes');
        if (orderNotes) orderNotes.textContent = order.customer_notes || 'لا توجد ملاحظات';

        // 8. Admin Notes
        const adminNotes = document.getElementById('adminNotes');
        if (adminNotes) {
            adminNotes.value = order.admin_notes || '';
            const saveBtn = document.getElementById('saveNotesBtn');
            if (saveBtn) saveBtn.onclick = () => saveOrderNotes(id);
        }

        // 9. Bind status select change handler
        if (statusSelect) {
            statusSelect.onchange = (e) => updateOrderStatus(id, e.target.value);
        }

        // Open Modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

    } catch (error) {
        console.error('Error viewing order:', error);
        alert('فشل في تحميل تفاصيل الطلب'); // Fallback alert
    }
}

/**
 * Update Order Timeline UI
 */
function updateOrderTimeline(status) {
    const timeline = document.getElementById('order-timeline');
    if (!timeline) return;

    const steps = [
        { status: 'pending', label: 'استلام', icon: 'grid_view' },
        { status: 'confirmed', label: 'تأكيد', icon: 'check' },
        { status: 'processing', label: 'تجهيز', icon: 'inventory_2' },
        { status: 'shipped', label: 'شحن', icon: 'local_shipping' },
        { status: 'delivered', label: 'تسليم', icon: 'check_circle' }
    ];

    const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered'];
    let currentIndex = statusOrder.indexOf(status);
    if (currentIndex === -1) currentIndex = 0; // Default to first if unknown or cancelled (though cancelled handling is separate usually)

    // Handle cancelled visually if needed, for now standard flow
    if (status === 'cancelled') {
        timeline.innerHTML = '<div style="text-align:center;color:#EF4444;font-weight:bold;padding:1rem;">الطلب ملغي 🚫</div>';
        return;
    }

    let html = '';
    steps.forEach((step, index) => {
        const isCompleted = index <= currentIndex;
        const isLast = index === steps.length - 1;

        const stepClass = isCompleted ? 'timeline-step completed' : 'timeline-step';
        const lineClass = isCompleted ? 'timeline-line completed' : 'timeline-line';

        html += `
            <div class="${stepClass}">
                <div class="step-icon">
                    ${isCompleted ? '<span class="material-icons-outlined">check</span>' : (index + 1)}
                </div>
                <span>${step.label}</span>
            </div>
        `;

        if (!isLast) {
            html += `<div class="${lineClass}"></div>`;
        }
    });

    timeline.innerHTML = html;
}

/**
 * Close Modal helper (if not already defined globally or needs specific logic)
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Update order status
 * Can be called with (id, status) or just (status) - uses currentOrderId in latter case
 */
async function updateOrderStatus(idOrStatus, status) {
    // Handle both signatures: updateOrderStatus(status) and updateOrderStatus(id, status)
    let id;
    if (status === undefined) {
        // Called with single param = status only, use global currentOrderId
        status = idOrStatus;
        id = currentOrderId;
    } else {
        id = idOrStatus;
    }

    if (!id) {
        alert('خطأ: لم يتم تحديد الطلب');
        return;
    }

    try {
        if (!confirm('هل أنت متأكد من تغيير حالة الطلب؟')) {
            // Revert select if cancelled
            const select = document.getElementById('orderStatusSelect');
            if (select) {
                viewOrder(id);
            }
            return;
        }

        await api.updateOrderStatus(id, status);

        // Show success
        // alert('تم تحديث الحالة بنجاح');

        // Refresh modal data to update timeline etc
        viewOrder(id);

        // Refresh main table if visible
        loadOrders();

    } catch (error) {
        console.error('Error updating status:', error);
        alert('فشل في تحديث الحالة: ' + error.message);
    }
}

/**
 * Save admin notes
 */
async function saveOrderNotes(id) {
    const textarea = document.getElementById('adminNotes');
    if (!textarea) return;

    const notes = textarea.value;
    const btn = document.getElementById('saveNotesBtn');

    try {
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="material-icons-outlined" style="animation:spin 1s linear infinite">sync</span> حفظ...';
            btn.disabled = true;
        }

        await api.updateAdminNotes(id, notes);

        if (btn) {
            btn.innerHTML = '<span class="material-icons-outlined">check</span> تم الحفظ';
            setTimeout(() => {
                btn.innerHTML = '<span class="material-icons-outlined">save</span> حفظ';
                btn.disabled = false;
            }, 2000);
        }

    } catch (error) {
        console.error('Error saving notes:', error);
        alert('فشل في حفظ الملاحظات: ' + error.message);
        if (btn) {
            btn.innerHTML = '<span class="material-icons-outlined">save</span> حفظ';
            btn.disabled = false;
        }
    }
}

/**
 * Edit product
 */
function editProduct(id) {
    // TODO: Implement edit modal
    console.log('Edit product:', id);
    alert('جاري فتح نافذة التعديل...');
}

/**
 * Remove Order Item
 */
async function removeOrderItem(orderId, itemId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج من الطلب؟ سيتم إعادة حساب إجمالي الطلب.')) {
        return;
    }

    try {
        await api.fetch(`/orders/${orderId}/items/${itemId}`, {
            method: 'DELETE'
        });

        // Refresh modal
        viewOrder(orderId);
        // Refresh main list
        loadOrders();

    } catch (error) {
        console.error('Error deleting item:', error);
        alert('فشل في حذف المنتج: ' + error.message);
    }
}

// ===============================================
// Initialize on page load
// ===============================================
document.addEventListener('DOMContentLoaded', () => {
    // Detect which page we're on and load appropriate data
    const path = window.location.pathname;

    if (path.includes('customers.html')) {
        loadCustomers();

        // Add search handler
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            let timeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => loadCustomers(), 300);
            });
        }
    } else if (path.includes('orders.html')) {
        loadOrders();

        // Add filter handlers
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => loadOrders());
        }

        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            let timeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => loadOrders(), 300);
            });
        }
    } else if (path.includes('products.html')) {
        loadProducts();

        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => loadProducts());
        }

        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            let timeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => loadProducts(), 300);
            });
        }
    } else if (path.includes('index.html') || path.endsWith('/admin/') || path.endsWith('/admin')) {
        loadDashboardStats();
    }

    console.log('✓ Admin API client initialized');
});

// Add loading spinner animation
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
document.head.appendChild(spinnerStyle);

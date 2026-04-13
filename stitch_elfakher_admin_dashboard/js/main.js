/* ========================================
   ELFAKHER Fabrics - Main JavaScript
   ======================================== */

// Dark Mode Toggle
function initDarkMode() {
    if (window.darkModeInitialized) return;
    window.darkModeInitialized = true;

    const toggleBtn = document.getElementById('darkModeToggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Check saved preference or system preference
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    // Update icon on initial load
    updateDarkModeIcon(isDark);

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const currentIsDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', currentIsDark ? 'dark' : 'light');
            updateDarkModeIcon(currentIsDark);
        });
    }
}

function updateDarkModeIcon(isDark) {
    const icon = document.querySelector('#darkModeToggle .material-icons-outlined');
    if (icon) {
        icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    }
}

// Mobile Menu
function initMobileMenu() {
    if (window.mobileMenuInitialized) return;
    window.mobileMenuInitialized = true;

    const menuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const closeBtn = document.getElementById('closeMobileMenu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        // Close on outside click
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Global Dropdown Toggler (Crucial for Mobile 'Three Dots' Menus)
document.addEventListener('click', function(e) {
    const toggleBtn = e.target.closest('.dropdown-toggle') || e.target.closest('.dropdown > .btn-admin-icon');
    if (toggleBtn) {
        e.preventDefault();
        const dropdown = toggleBtn.closest('.dropdown');
        
        // Close other open dropdowns
        document.querySelectorAll('.dropdown.active').forEach(d => {
            if (d !== dropdown) d.classList.remove('active');
        });
        
        dropdown.classList.toggle('active');
        return;
    }
    
    // Close dropdowns when clicking outside
    if (!e.target.closest('.dropdown-menu')) {
        document.querySelectorAll('.dropdown.active').forEach(d => {
            d.classList.remove('active');
        });
    }
});

// Admin Sidebar Functions (for mobile)
function openSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) {
        sidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Cart Functions
// Prevent redeclaration error
if (!window.cart) {
    const storedCart = localStorage.getItem('elfakher_cart');

    window.cart = {
        items: JSON.parse(storedCart || '[]'),

        add(product) {

            // Find existing item with same product and options
            const existingIndex = this.items.findIndex(item =>
                item.productId === product.productId &&
                item.color === product.color &&
                item.size === product.size &&
                item.collar === product.collar &&
                item.button === product.button &&
                item.sleeve === product.sleeve
            );

            if (existingIndex > -1) {
                this.items[existingIndex].quantity += product.quantity || 1;
            } else {
                this.items.push({ ...product, quantity: product.quantity || 1 });
            }

            this.save();
            this.updateUI();
            this.showNotification('تمت الإضافة إلى السلة');
        },

        remove(index) {
            this.items.splice(index, 1);
            this.save();
            this.updateUI();
        },

        updateQuantity(index, quantity) {
            if (quantity <= 0) {
                this.remove(index);
            } else {
                this.items[index].quantity = quantity;
                this.save();
                this.updateUI();
            }
        },

        clear() {
            this.items = [];
            this.save();
            this.updateUI();
        },

        getTotal() {
            return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        },

        getCount() {
            return this.items.reduce((count, item) => count + item.quantity, 0);
        },

        save() {
            try {
                localStorage.setItem('elfakher_cart', JSON.stringify(this.items));
            } catch (e) {
                console.error('❌ Cart save error:', e);
                // Clear old data and try again
                if (e.name === 'QuotaExceededError') {
                    localStorage.clear();
                    alert('تم مسح البيانات القديمة لتوفير مساحة. يرجى إعادة المحاولة.');
                    try {
                        localStorage.setItem('elfakher_cart', JSON.stringify(this.items));
                    } catch (e2) {
                        alert('خطأ في حفظ السلة');
                    }
                }
            }
        },

        updateUI() {
            const badges = document.querySelectorAll('.cart-badge');
            const count = this.getCount();

            badges.forEach(badge => {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            });

            // Re-render cart items if we are on the cart page
            if (document.querySelector('.cart-items-container')) {
                this.render();
            }
        },

        showNotification(message) {
            const notification = document.createElement('div');
            notification.className = 'cart-notification';
            notification.innerHTML = `
            <span class="material-icons-outlined">check_circle</span>
            <span>${message}</span>
        `;

            document.body.appendChild(notification);

            setTimeout(() => notification.classList.add('show'), 10);
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        },

        render() {
            const container = document.querySelector('.cart-items-container');
            const summaryContainer = document.querySelector('.cart-summary-container');
            const cartHeader = document.querySelector('.cart-header');

            if (!container) return;

            if (this.items.length === 0) {
                container.innerHTML = `
                    <div class="empty-cart-state">
                        <div class="empty-icon-box">
                            <span class="material-icons-outlined">shopping_bag</span>
                        </div>
                        <h2>سلة التسوق فارغة</h2>
                        <p>يبدو أنك لم تضف أي منتجات إلى سلتك بعد. اكتشف تشكيلتنا الجديدة الآن!</p>
                        <a href="products.html" style="text-decoration: none;">
                            <button class="checkout-btn" style="width: auto; padding: 1rem 2rem; margin: 0 auto;">
                                ابدأ التسوق
                                <span class="material-icons-outlined">arrow_back</span>
                            </button>
                        </a>
                    </div>
                `;
                if (summaryContainer) summaryContainer.style.display = 'none';
                if (cartHeader) cartHeader.textContent = 'المنتجات (0)';
                return;
            }

            if (summaryContainer) summaryContainer.style.display = 'block';
            if (cartHeader) cartHeader.textContent = `المنتجات (${this.getCount()})`;

            container.innerHTML = this.items.map((item, index) => `
                <div class="cart-item" data-index="${index}">
                    <div class="cart-item-image">
                        <img src="${item.image}" alt="${item.title}" onerror="this.src='../assets/logo.png'">
                    </div>
                    <div class="cart-item-content">
                        <div class="cart-item-info">
                            <h3>${item.title}</h3>
                            <div class="cart-item-variants">
                                ${this.formatOptions(item).split(' | ').filter(v => v).map(v => `<span class="variant-chip">${v}</span>`).join('')}
                            </div>
                            <div class="cart-item-price">${formatPrice(item.price)}</div>
                        </div>
                        <div class="cart-item-actions">
                            <div class="qty-control">
                                <button class="qty-btn" onclick="cart.updateQuantity(${index}, ${item.quantity - 1})">
                                    <span class="material-icons-outlined" style="font-size: 1.25rem;">remove</span>
                                </button>
                                <input type="number" class="qty-input" value="${item.quantity}" min="1" 
                                    onchange="cart.updateQuantity(${index}, parseInt(this.value))">
                                <button class="qty-btn" onclick="cart.updateQuantity(${index}, ${item.quantity + 1})">
                                    <span class="material-icons-outlined" style="font-size: 1.25rem;">add</span>
                                </button>
                            </div>
                            <button class="delete-btn" onclick="cart.remove(${index})" aria-label="حذف">
                                <span class="material-icons-outlined">delete_outline</span>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');

            this.updateTotals();
        },

        formatOptions(item) {
            if (!item) return '';
            const parts = [];

            if (item.type === 'fabric') {
                if (item.color) parts.push(`اللون: ${item.color}`);
                // if (item.unit) parts.push(`الوحدة: ${item.unit}`);
                return parts.join(' | ');
            }

            // For clothes
            if (item.color) parts.push(`اللون: ${item.color}`);
            if (item.size) parts.push(`المقاس: ${item.size}`);

            // Optional features if they exist and are not 'none' or default
            if (item.collar) parts.push(`الكول: ${item.collar}`);
            if (item.button && item.button !== 'none') parts.push(`الأزرار: ${item.button}`);
            if (item.sleeve) parts.push(`الأكمام: ${item.sleeve}`);

            return parts.join(' | ');
        },

        updateTotals() {
            const subtotal = this.getTotal();
            const subtotalEl = document.querySelector('.summary-subtotal');
            const totalEl = document.querySelector('.summary-total');

            if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
            if (totalEl) totalEl.textContent = formatPrice(subtotal);
        }
    };
}

// Product Image Gallery
function initProductGallery() {
    const mainImage = document.getElementById('mainProductImage');
    const thumbnails = document.querySelectorAll('.product-thumbnail');

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            // Update main image
            if (mainImage) {
                mainImage.src = thumb.dataset.src || thumb.src;
            }

            // Update active thumbnail
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });
}

// Size Selection
function initSizeSelection() {
    const sizeButtons = document.querySelectorAll('.size-btn');

    sizeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            sizeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// Form Validation
function validateForm(form) {
    const inputs = form.querySelectorAll('[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
    });

    return isValid;
}

// Quick Order Form - Handled in product.html inline script
function initQuickOrderForm() {
    // Skip - product.html has its own submitQuickOrder handler
}

// Quantity Input
function initQuantityInputs() {
    document.querySelectorAll('.quantity-control').forEach(control => {
        const minusBtn = control.querySelector('.qty-minus');
        const plusBtn = control.querySelector('.qty-plus');
        const input = control.querySelector('.qty-input');

        if (minusBtn && plusBtn && input) {
            minusBtn.addEventListener('click', () => {
                const value = parseInt(input.value) || 1;
                if (value > 1) {
                    input.value = value - 1;
                    input.dispatchEvent(new Event('change'));
                }
            });

            plusBtn.addEventListener('click', () => {
                const value = parseInt(input.value) || 1;
                input.value = value + 1;
                input.dispatchEvent(new Event('change'));
            });
        }
    });
}

// Smooth Scroll for Anchor Links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Wilaya (State) Data for Algeria
if (!window.wilayas) {
    window.wilayas = [
        { code: '01', name: 'Adrar' },
        { code: '02', name: 'Chlef' },
        { code: '03', name: 'Laghouat' },
        { code: '04', name: 'Oum El Bouaghi' },
        { code: '05', name: 'Batna' },
        { code: '06', name: 'Béjaïa' },
        { code: '07', name: 'Biskra' },
        { code: '08', name: 'Béchar' },
        { code: '09', name: 'Blida' },
        { code: '10', name: 'Bouira' },
        { code: '11', name: 'Tamanrasset' },
        { code: '12', name: 'Tébessa' },
        { code: '13', name: 'Tlemcen' },
        { code: '14', name: 'Tiaret' },
        { code: '15', name: 'Tizi Ouzou' },
        { code: '16', name: 'Alger' },
        { code: '17', name: 'Djelfa' },
        { code: '18', name: 'Jijel' },
        { code: '19', name: 'Sétif' },
        { code: '20', name: 'Saïda' },
        { code: '21', name: 'Skikda' },
        { code: '22', name: 'Sidi Bel Abbès' },
        { code: '23', name: 'Annaba' },
        { code: '24', name: 'Guelma' },
        { code: '25', name: 'Constantine' },
        { code: '26', name: 'Médéa' },
        { code: '27', name: 'Mostaganem' },
        { code: '28', name: "M'Sila" },
        { code: '29', name: 'Mascara' },
        { code: '30', name: 'Ouargla' },
        { code: '31', name: 'Oran' },
        { code: '32', name: 'El Bayadh' },
        { code: '33', name: 'Illizi' },
        { code: '34', name: 'Bordj Bou Arréridj' },
        { code: '35', name: 'Boumerdès' },
        { code: '36', name: 'El Tarf' },
        { code: '37', name: 'Tindouf' },
        { code: '38', name: 'Tissemsilt' },
        { code: '39', name: 'El Oued' },
        { code: '40', name: 'Khenchela' },
        { code: '41', name: 'Souk Ahras' },
        { code: '42', name: 'Tipaza' },
        { code: '43', name: 'Mila' },
        { code: '44', name: 'Aïn Defla' },
        { code: '45', name: 'Naâma' },
        { code: '46', name: 'Aïn Témouchent' },
        { code: '47', name: 'Ghardaïa' },
        { code: '48', name: 'Relizane' },
        { code: '49', name: 'El M\'Ghair' },
        { code: '50', name: 'El Meniaa' },
        { code: '51', name: 'Ouled Djellal' },
        { code: '52', name: 'Bordj Badji Mokhtar' },
        { code: '53', name: 'Béni Abbès' },
        { code: '54', name: 'Timimoun' },
        { code: '55', name: 'Touggourt' },
        { code: '56', name: 'Djanet' },
        { code: '57', name: 'In Salah' },
        { code: '58', name: 'In Guezzam' }
    ];
}

function populateWilayaSelect() {
    const selects = document.querySelectorAll('.wilaya-select');

    selects.forEach(select => {
        wilayas.forEach(wilaya => {
            const option = document.createElement('option');
            option.value = wilaya.code;
            option.textContent = `${wilaya.code} - ${wilaya.name}`;
            select.appendChild(option);
        });
    });
}

// Format Price
function formatPrice(price) {
    return new Intl.NumberFormat('ar-DZ', {
        style: 'decimal',
        minimumFractionDigits: 0
    }).format(price) + ' DZD';
}

// ========== Product Page Functions ==========

// Add to Cart Button
function initAddToCart() {
    const addBtn = document.querySelector('.add-to-cart-btn, .btn-primary[onclick*="addToCart"]');
    const addBtns = document.querySelectorAll('.add-to-cart-btn');

    // Single product page
    document.querySelectorAll('[onclick*="addToCart"]').forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', handleAddToCart);
    });
}

function handleAddToCart() {
    // Get selected options
    const selectedSize = document.querySelector('.size-btn.selected')?.dataset.size ||
        document.querySelector('.size-btn.selected')?.textContent || '54';
    const selectedCollar = document.querySelector('[name="collar"]:checked')?.value || null;
    const selectedButton = document.querySelector('[name="button"]:checked')?.value || null;
    const selectedSleeve = document.querySelector('[name="sleeve"]:checked')?.value || null;
    const quantity = parseInt(document.getElementById('qtyInput')?.value) || 1;
    const selectedColor = document.querySelector('.color-choice.selected')?.getAttribute('title') || null;

    // Get product info from page
    const title = document.getElementById('productTitle')?.textContent ||
        document.querySelector('.product-title, h1')?.textContent || 'ثوب';

    // Use stored price from API first, fallback to DOM
    let price = window.productPrice || 0;
    if (!price) {
        const priceText = document.getElementById('productPrice')?.textContent ||
            document.querySelector('.product-price')?.textContent || '0';
        price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;
    }

    const mainImg = document.getElementById('mainImage')?.src || '';
    const image = mainImg.length > 200 ? '' : mainImg;

    // Check for custom measurements
    const customMeasurements = {};
    document.querySelectorAll('#measurementsForm input, .measurements-form input').forEach(input => {
        if (input.value) {
            customMeasurements[input.name || input.previousElementSibling?.textContent] = input.value;
        }
    });

    const product = {
        productId: new URLSearchParams(window.location.search).get('id') || Date.now(),
        title,
        price,
        image,
        quantity,
        color: selectedColor,
        size: selectedSize,
        collar: selectedCollar,
        button: selectedButton,
        sleeve: selectedSleeve
    };

    cart.add(product);
}

// Product Card Add Button (Products Listing)
function initProductCardButtons() {
    document.querySelectorAll('.product-card').forEach(card => {
        const addBtn = card.querySelector('.add-btn, [onclick*="add"]');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const title = card.querySelector('.product-title, h3')?.textContent;
                const priceText = card.querySelector('.product-price')?.textContent || '0';
                const price = parseInt(priceText.replace(/[^\d]/g, ''));
                const image = card.querySelector('img')?.src;

                cart.add({
                    id: Date.now(),
                    title,
                    price,
                    image,
                    quantity: 1,
                    options: { size: '54' }
                });
            });
        }
    });
}

// ========== Cart Page Functions ==========

function initCartPage() {
    if (!document.querySelector('.cart-section')) return;
    cart.render();
}

function updateCartTotals() {
    let subtotal = 0;
    document.querySelectorAll('.cart-item').forEach(item => {
        const priceText = item.querySelector('.product-price, [style*="accent"]')?.textContent || '0';
        const price = parseInt(priceText.replace(/[^\d]/g, ''));
        const qty = parseInt(item.querySelector('.qty-input')?.value) || 1;
        subtotal += price * qty;
    });

    // Update summary
    const subtotalEl = document.querySelector('.summary-row:first-child span:last-child');
    const totalEl = document.querySelector('.summary-row.total span:last-child');

    if (subtotalEl) subtotalEl.textContent = formatNumber(subtotal) + ' دج';
    if (totalEl) totalEl.textContent = formatNumber(subtotal) + ' دج';
}

// ========== Checkout Page Functions ==========

function initCheckoutPage() {
    // Skip if page has its own checkout handler (checkout.html)
    if (document.getElementById('checkoutForm')) {
        return;
    }

    const form = document.querySelector('.checkout-form form, form');
    if (!form || !document.querySelector('.checkout-section')) return;

    // Payment options toggle
    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', function () {
            document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            this.querySelector('input').checked = true;
        });
    });

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!validateForm(form)) {
            showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        // Show success
        showNotification('تم تأكيد طلبك بنجاح! 🎉');

        // Clear cart
        cart.clear();

        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    });
}

// ========== Filter Functions ==========

function initFilters() {
    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterProducts(this.textContent);
        });
    });

    // Sidebar filters
    document.querySelectorAll('.filter-option input').forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });

    // Sort select
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            sortProducts(this.value);
        });
    }
}

function filterProducts(category) {
    // For demo, just show notification
    showNotification(`تم تطبيق الفلتر: ${category}`);
}

function applyFilters() {
    showNotification('تم تطبيق الفلاتر');
}

function sortProducts(sortBy) {
    showNotification(`ترتيب حسب: ${sortBy}`);
}

// ========== Admin Functions ==========

function initAdminActions() {
    // Delete buttons
    document.querySelectorAll('[style*="danger"]').forEach(btn => {
        if (btn.querySelector('.material-icons-outlined')?.textContent === 'delete') {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                if (confirm('هل أنت متأكد من الحذف؟')) {
                    const row = this.closest('tr') || this.closest('.product-admin-card') || this.closest('.option-item');
                    if (row) {
                        row.style.opacity = '0.5';
                        setTimeout(() => row.remove(), 300);
                        showNotification('تم الحذف بنجاح');
                    }
                }
            });
        }
    });

    // Edit buttons
    document.querySelectorAll('.btn-admin-icon, .btn-admin-outline').forEach(btn => {
        const icon = btn.querySelector('.material-icons-outlined');
        if (icon?.textContent === 'edit' || btn.textContent.includes('تعديل')) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                showNotification('فتح نافذة التعديل...');
            });
        }
    });

    // Add new buttons
    document.querySelectorAll('.btn-admin-primary').forEach(btn => {
        if (btn.textContent.includes('إضافة')) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                showNotification('فتح نافذة الإضافة...');
            });
        }
    });

    // Toggle switches
    document.querySelectorAll('.toggle').forEach(toggle => {
        toggle.addEventListener('click', function () {
            this.classList.toggle('active');
            const label = this.closest('.toggle-switch')?.querySelector('.toggle-label')?.textContent;
            const state = this.classList.contains('active') ? 'مفعّل' : 'معطّل';
            showNotification(`${label}: ${state}`);
        });
    });

    // Status badge click
    document.querySelectorAll('.status-badge').forEach(badge => {
        badge.style.cursor = 'pointer';
        badge.addEventListener('click', function () {
            const statuses = ['pending', 'processing', 'shipped', 'delivered'];
            const labels = ['قيد الانتظار', 'قيد التجهيز', 'تم الشحن', 'تم التسليم'];
            const current = statuses.findIndex(s => this.classList.contains(s));
            const next = (current + 1) % statuses.length;

            this.classList.remove(...statuses);
            this.classList.add(statuses[next]);
            this.textContent = labels[next];

            showNotification(`تم تغيير الحالة إلى: ${labels[next]}`);
        });
    });

    // Add option buttons
    document.querySelectorAll('.add-option-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            showNotification('فتح نافذة إضافة خيار جديد...');
        });
    });

    // Settings save
    const saveBtn = document.querySelector('.btn-admin-primary .material-icons-outlined');
    if (saveBtn?.textContent === 'save') {
        saveBtn.closest('.btn-admin-primary').addEventListener('click', function (e) {
            e.preventDefault();
            showNotification('تم حفظ الإعدادات بنجاح! ✓');
        });
    }

    // Export button
    document.querySelectorAll('.btn-admin-outline').forEach(btn => {
        if (btn.textContent.includes('تصدير')) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                showNotification('جاري تصدير البيانات...');
            });
        }
    });
}

// ========== Navigation Functions ==========

function initNavigation() {
    // Fix all navigation links
    document.querySelectorAll('a[href="#"]').forEach(link => {
        // Don't change if it has onclick handler
        if (!link.getAttribute('onclick')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
            });
        }
    });
}

// ========== Contact Form ==========

function initContactForm() {
    const form = document.querySelector('.contact-form form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validateForm(form)) {
                showNotification('تم إرسال رسالتك بنجاح! سنرد عليك قريباً.');
                form.reset();
            }
        });
    }
}

// ========== Utility Functions ==========

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.style.backgroundColor = type === 'error' ? 'var(--error, #EF4444)' : 'var(--primary)';
    notification.innerHTML = `
        <span class="material-icons-outlined">${type === 'error' ? 'error' : 'check_circle'}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

function formatNumber(num) {
    return new Intl.NumberFormat('ar-DZ').format(num);
}

// Format Price
function formatPrice(price) {
    return new Intl.NumberFormat('ar-DZ', {
        style: 'decimal',
        minimumFractionDigits: 0
    }).format(price) + ' دج';
}

// ========== Initialize Everything ==========

function initAuth() {
    // Only apply to admin pages
    if (!window.location.pathname.includes('/admin/') || window.location.pathname.includes('login.html')) {
        return;
    }

    const token = localStorage.getItem('elfakher_token');

    if (!token) {
        window.location.href = '/admin/login.html';
        return;
    }

    // Verify token validity
    fetch('/api/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
        if (!res.ok) {
            localStorage.removeItem('elfakher_token');
            localStorage.removeItem('elfakher_user');
            window.location.href = '/admin/login.html';
        }
    }).catch(err => {
        console.error('Auth check error:', err);
    });
}

function logout() {
    localStorage.removeItem('elfakher_token');
    localStorage.removeItem('elfakher_user');
    window.location.href = '/admin/login.html';
}

document.addEventListener('DOMContentLoaded', () => {
    initAuth(); // التحقق من المصادقة أولاً
    initDarkMode();
    initMobileMenu();
    initProductGallery();
    initSizeSelection();
    initQuickOrderForm();
    initQuantityInputs();
    initSmoothScroll();
    populateWilayaSelect();
    cart.updateUI();

    // New initializations
    initAddToCart();
    initProductCardButtons();
    initCartPage();
    initCheckoutPage();
    initFilters();
    initAdminActions();
    initNavigation();
    initContactForm();

    // Setup Logout Buttons
    document.querySelectorAll('[onclick="logout()"], .logout-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });

    // Update dark mode icon on load
    const isDark = document.documentElement.classList.contains('dark');
    updateDarkModeIcon(isDark);
});

// Add notification styles dynamically
if (!document.getElementById('main-notification-styles')) {
    const notificationStyles = document.createElement('style');
    notificationStyles.id = 'main-notification-styles';
    notificationStyles.textContent = `
    .cart-notification {
        position: fixed;
        bottom: 6rem;
        right: 1.5rem;
        background-color: var(--primary);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        transform: translateX(120%);
        transition: transform 0.3s ease;
        z-index: 1000;
        font-family: inherit;
    }
    
    .cart-notification.show {
        transform: translateX(0);
    }
    
    .cart-notification .material-icons-outlined {
        color: #10B981;
    }
    
    .filter-option input:checked + span,
    .filter-option:has(input:checked) {
        font-weight: 600;
    }
`;
    document.head.appendChild(notificationStyles);
}


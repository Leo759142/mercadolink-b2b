const store = {
    products: [],
    contacts: [],
    messages: [],
    orders: [],
    tracking: [],
    currentChat: null,
};

const STORAGE_KEY = 'b2b_nexus_v1';

function loadStore() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            Object.assign(store, data);
        } else {
            seedData();
            saveStore();
        }
    } catch (e) {
        seedData();
        saveStore();
    }
}

function saveStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function seedData() {
    store.products = [
        { id: 1, name: 'Sensor IoT X200', category: 'electronics', price: 124.5, stock: 340, icon: '🔌' },
        { id: 2, name: 'Controlador PLC V5', category: 'electronics', price: 899.0, stock: 45, icon: '🧩' },
        { id: 3, name: 'Fibra Textil Premium', category: 'textiles', price: 32.0, stock: 1200, icon: '🧵' },
        { id: 4, name: 'Tejido Industrial 3m', category: 'textiles', price: 18.75, stock: 800, icon: '🧶' },
        { id: 5, name: 'Acero Inoxidable Barra', category: 'raw-materials', price: 210.0, stock: 150, icon: '🔩' },
        { id: 6, name: 'Polímero Resina 25kg', category: 'raw-materials', price: 65.0, stock: 400, icon: '⚗️' },
        { id: 7, name: 'Empaque Alimentario 500u', category: 'food', price: 14.99, stock: 2500, icon: '🥫' },
        { id: 8, name: 'Lata Conserva 12oz', category: 'food', price: 2.5, stock: 5000, icon: '🥕' },
    ];

    store.contacts = [
        { id: 1, name: 'Logística Global', initials: 'LG', status: 'online' },
        { id: 2, name: 'TechSupply Corp', initials: 'TS', status: 'online' },
        { id: 3, name: 'Cliente Alpha', initials: 'CA', status: 'away' },
        { id: 4, name: 'Transportes Rápidos', initials: 'TR', status: 'online' },
    ];

    store.messages = [
        { id: 1, contactId: 1, from: 'them', text: 'Buenos días, la mercancía está lista.', time: Date.now() - 3600000 },
        { id: 2, contactId: 1, from: 'me', text: 'Perfecto, pasamos a coordinar recolección.', time: Date.now() - 3400000 },
        { id: 3, contactId: 2, from: 'them', text: '¿Aumentamos pedido de sensores?', time: Date.now() - 1800000 },
        { id: 4, contactId: 3, from: 'them', text: 'Aprobado pedido #1042.', time: Date.now() - 900000 },
        { id: 5, contactId: 4, from: 'them', text: 'Envío TK-001 en ruta.', time: Date.now() - 300000 },
    ];

    store.orders = [
        { id: 1001, product: 'Sensor IoT X200', qty: 50, total: 6225, status: 'shipped', date: Date.now() - 86400000 * 2 },
        { id: 1002, product: 'Controlador PLC V5', qty: 2, total: 1798, status: 'processing', date: Date.now() - 86400000 },
        { id: 1003, product: 'Empaque Alimentario 500u', qty: 200, total: 2998, status: 'pending', date: Date.now() - 43200000 },
    ];

    store.tracking = [
        {
            id: 'TK-001',
            orderId: 1001,
            carrier: 'Logística Global',
            status: 'in_transit',
            stages: [
                { key: 'recibido', label: 'Recibido en almacén', time: Date.now() - 86400000 * 2, done: true },
                { key: 'empacado', label: 'Empaque y etiquetado', time: Date.now() - 86400000 * 2 + 3600000, done: true },
                { key: 'enviado', label: 'Enviado', time: Date.now() - 86400000 + 3600000, done: true },
                { key: 'transito', label: 'En tránsito', time: Date.now() - 43200000, done: true, active: true },
                { key: 'reparto', label: 'Reparto', time: null, done: false },
                { key: 'entregado', label: 'Entregado', time: null, done: false },
            ]
        },
        {
            id: 'TK-002',
            orderId: 1002,
            carrier: 'Transportes Rápidos',
            status: 'pending',
            stages: [
                { key: 'recibido', label: 'Recibido en almacén', time: Date.now() - 86400000, done: true },
                { key: 'empacado', label: 'Empaque y etiquetado', time: null, done: false },
                { key: 'enviado', label: 'Enviado', time: null, done: false },
                { key: 'transito', label: 'En tránsito', time: null, done: false },
                { key: 'reparto', label: 'Reparto', time: null, done: false },
                { key: 'entregado', label: 'Entregado', time: null, done: false },
            ]
        },
    ];
}

/* ---------- Mock Async API ---------- */
const api = {
    delay(ms = 400) {
        return new Promise(r => setTimeout(r, ms));
    },

    async init() {
        await this.delay(1400);
        loadStore();
        return store;
    },

    async filterProducts(category) {
        await this.delay(250);
        if (!category || category === 'all') return store.products;
        return store.products.filter(p => p.category === category);
    },

    async sendMessage(contactId, text) {
        await this.delay(300);
        const msg = {
            id: Date.now() + Math.random(),
            contactId,
            from: 'me',
            text,
            time: Date.now()
        };
        store.messages.push(msg);
        saveStore();
        return msg;
    },

    async createOrder(productId, qty) {
        await this.delay(500);
        const product = store.products.find(p => p.id === productId);
        if (!product) throw new Error('Producto no encontrado');
        const order = {
            id: 1000 + store.orders.length + 1,
            product: product.name,
            qty: Number(qty) || 1,
            total: product.price * (Number(qty) || 1),
            status: 'pending',
            date: Date.now()
        };
        store.orders.push(order);
        product.stock = Math.max(0, product.stock - order.qty);
        saveStore();
        return order;
    },

    async getTracking(id) {
        await this.delay(350);
        return store.tracking.find(t => t.id.toLowerCase() === id.toLowerCase()) || null;
    }
};

/* ---------- UI Helpers ---------- */
function $(id) { return document.getElementById(id); }

function formatMoney(n) {
    return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTime(ts) {
    if (!ts) return '---';
    const d = new Date(ts);
    return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function setStatus(key, text) {
    const el = $(key);
    if (el) el.textContent = text;
}

function setPulse(state) {
    const el = $('socket-indicator');
    if (!el) return;
    const dot = el.querySelector('.pulse');
    dot.className = 'pulse ' + (state || '');
}

/* ---------- Views ---------- */
async function renderDashboard() {
    const activeOrders = store.orders.filter(o => ['pending','processing','shipped'].includes(o.status)).length;
    const inTransit = store.tracking.filter(t => t.status === 'in_transit').length;
    const pendingPayments = store.orders
        .filter(o => o.status === 'pending')
        .reduce((s, o) => s + o.total, 0);

    $('stat-orders').textContent = activeOrders;
    $('stat-transit').textContent = inTransit;
    $('stat-pending').textContent = formatMoney(pendingPayments);

    // Recent orders
    const ro = $('recent-orders-list');
    ro.innerHTML = store.orders.slice(0, 5).reverse().map(o => {
        const cls = `status-${o.status}`;
        const label = { pending: 'Pendiente', processing: 'En proceso', shipped: 'Enviado', completed: 'Completado' }[o.status] || o.status;
        return `<div class="order-item">
            <div>
                <div class="order-id">#${o.id}</div>
                <div style="color:var(--text-secondary);font-size:12px;">${o.product} · x${o.qty}</div>
            </div>
            <div class="order-status ${cls}">${label}</div>
        </div>`;
    }).join('') || '<div class="empty-state">Sin pedidos recientes</div>';

    // Activity
    const act = $('activity-log');
    act.innerHTML = store.messages.slice(-6).reverse().map(m => {
        const c = store.contacts.find(x => x.id === m.contactId);
        return `<div class="activity-item">
            <div class="activity-dot"></div>
            <div>
                <div style="font-weight:600;">${c ? c.name : 'Sistema'}</div>
                <div style="color:var(--text-secondary);font-size:12px;">${m.text}</div>
                <div style="color:var(--text-secondary);font-size:11px;margin-top:2px;">${formatTime(m.time)}</div>
            </div>
        </div>`;
    }).join('') || '<div class="empty-state">Sin actividad</div>';
}

async function renderCatalog(category = 'all') {
    const grid = $('products-grid');
    grid.innerHTML = '<div class="empty-state">Cargando catálogo...</div>';
    const products = await api.filterProducts(category);
    if (!products.length) {
        grid.innerHTML = '<div class="empty-state">No hay productos</div>';
        return;
    }
    grid.innerHTML = products.map(p => {
        const imgClass = `img-${p.category || 'electronics'}`;
        return `<div class="product-card">
            <div class="product-image ${imgClass}">${p.icon || '📦'}</div>
            <div class="product-details">
                <div class="product-category">${p.category || 'General'}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-meta">
                    <div>
                        <div class="product-price">${formatMoney(p.price)}</div>
                        <div class="product-stock">Stock: ${p.stock}</div>
                    </div>
                    <button class="btn-primary btn-sm" onclick="addToOrder(${p.id})">Pedir</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function renderOrders() {
    const tbody = $('orders-table-body');
    const map = { pending: 'Pendiente', processing: 'En proceso', shipped: 'Enviado', completed: 'Completado' };
    tbody.innerHTML = store.orders.map(o => {
        const statusLabel = map[o.status] || o.status;
        return `<tr>
            <td>#${o.id}</td>
            <td>${o.product}</td>
            <td>${o.qty}</td>
            <td>${formatMoney(o.total)}</td>
            <td><span class="order-status status-${o.status}">${statusLabel}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-primary btn-sm" onclick="viewTracking('TK-00${o.id}')">Seguimiento</button>
                    ${o.status === 'pending' ? `<button class="btn-primary btn-sm" onclick="payForOrder(${o.id})">Pagar</button>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderTracking(filterId) {
    const container = $('tracking-list');
    const list = filterId ? store.tracking.filter(t => t.id === filterId) : store.tracking;

    if (!list.length) {
        container.innerHTML = '<div class="empty-state">Sin envíos registrados</div>';
        return;
    }

    container.innerHTML = list.map(t => {
        const completed = t.stages.filter(s => s.done).length;
        const percent = Math.round((completed / t.stages.length) * 100);
        const statusLabel = { pending: 'Pendiente', in_transit: 'En tránsito', out_for_delivery: 'Reparto', delivered: 'Entregado' }[t.status] || t.status;

        return `<div class="tracking-card">
            <div class="tracking-header">
                <div>
                    <div class="tracking-id">${t.id}</div>
                    <div class="tracking-meta">${t.carrier} · Pedido #${t.orderId}</div>
                </div>
                <div class="order-status status-${t.status === 'in_transit' ? 'shipped' : t.status === 'out_for_delivery' ? 'processing' : 'pending'}">${statusLabel}</div>
            </div>
            <div class="tracking-body">
                ${t.stages.map((s, i) => {
                    const cls = s.done ? 'done' : (s.active ? 'active' : '');
                    return `<div class="tracking-event ${cls}">
                        <div class="event-title">${s.label}</div>
                        <div class="event-time">${formatTime(s.time)}</div>
                    </div>`;
                }).join('')}
            </div>
            <div class="time-bar-wrap">
                <div class="time-bar-label">
                    <span>Progreso del envío</span>
                    <span>${percent}%</span>
                </div>
                <div class="time-bar">
                    <div class="time-bar-fill" data-width="${percent}"></div>
                </div>
            </div>
        </div>`;
    }).join('');

    // Animate time bars after render
    requestAnimationFrame(() => {
        container.querySelectorAll('.time-bar-fill').forEach(bar => {
            const target = bar.getAttribute('data-width');
            bar.style.width = target + '%';
        });
    });
}

function renderChat() {
    const list = $('chat-contacts');
    list.innerHTML = store.contacts.map(c => {
        const unread = store.messages.filter(m => m.contactId === c.id && m.from === 'them').length;
        return `<div class="chat-contact${store.currentChat === c.id ? ' active' : ''}" onclick="selectChat(${c.id})">
            <div class="contact-avatar">${c.initials}</div>
            <div class="contact-meta">
                <strong>${c.name}</strong>
                <small>${unread > 0 ? `${unread} sin leer` : 'Sin mensajes nuevos'}</small>
            </div>
        </div>`;
    }).join('');

    if (!store.currentChat) {
        $('chat-header').textContent = 'Seleccione una conversación';
        $('chat-messages').innerHTML = '<div class="empty-state">Seleccione un contacto para comenzar</div>';
        return;
    }

    const contact = store.contacts.find(c => c.id === store.currentChat);
    $('chat-header').textContent = contact ? `${contact.name} · ${contact.status === 'online' ? 'En línea' : 'Ausente'}` : 'Conversación';
    const msgs = store.messages.filter(m => m.contactId === store.currentChat);
    $('chat-messages').innerHTML = msgs.map(m => {
        const cls = m.from === 'me' ? 'sent' : 'received';
        return `<div class="chat-message ${cls}">
            <div>${m.text}</div>
            <span class="chat-time">${formatTime(m.time)}</span>
        </div>`;
    }).join('') || '<div class="empty-state">Escribe el primer mensaje</div>';

    $('chat-messages').scrollTop = $('chat-messages').scrollHeight;
}

/* ---------- Actions ---------- */
function showSection(name) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    const target = $(name);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => {
        if (b.getAttribute('onclick')?.includes(name)) b.classList.add('active');
    });

    if (name === 'dashboard') renderDashboard();
    if (name === 'catalog') renderCatalog('all');
    if (name === 'orders') renderOrders();
    if (name === 'tracking') renderTracking();
    if (name === 'chat') renderChat();
}

async function filterProducts(category) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`.filter-btn[onclick*="'${category}'"]`);
    if (btn) btn.classList.add('active');
    await renderCatalog(category);
}

async function addToOrder(productId) {
    const qty = prompt('Cantidad:', '1');
    if (!qty || Number(qty) <= 0) return;
    try {
        const order = await api.createOrder(productId, Number(qty));
        alert(`Pedido creado #${order.id}`);
        showSection('orders');
        renderOrders();
        renderDashboard();
    } catch (e) {
        alert(e.message);
    }
}

async function payForOrder(orderId) {
    const order = store.orders.find(o => o.id === orderId);
    if (!order) return;
    if (!confirm(`Confirmar pago de ${formatMoney(order.total)} para el pedido #${order.id}?`)) return;
    order.status = 'processing';
    saveStore();
    renderOrders();
    renderDashboard();
    alert('Pago procesado correctamente.');
}

async function sendChatMessage() {
    const input = $('chat-input');
    const text = input.value.trim();
    if (!text || !store.currentChat) return;

    await api.sendMessage(store.currentChat, text);
    input.value = '';
    renderChat();
    updateBadge();

    // Simulated reply
    setTimeout(async () => {
        const replies = [
            'Entendido, coordinamos ahora.',
            'Gracias, lo revisamos y respondemos.',
            'Confirmado, procedemos.',
            'Perfecto, le informamos pronto.',
            'Recibido, estamos en ello.',
        ];
        const reply = {
            id: Date.now() + Math.random(),
            contactId: store.currentChat,
            from: 'them',
            text: replies[Math.floor(Math.random() * replies.length)],
            time: Date.now()
        };
        store.messages.push(reply);
        saveStore();
        renderChat();
        updateBadge();
    }, 1500 + Math.random() * 2500);
}

function handleChatKey(e) {
    if (e.key === 'Enter') sendChatMessage();
}

function selectChat(contactId) {
    store.currentChat = contactId;
    // mark as read locally? simplified
    renderChat();
    updateBadge();
}

function viewTracking(id) {
    showSection('tracking');
    setTimeout(() => {
        $('tracking-list').innerHTML = '<div class="empty-state">Buscando envío...</div>';
        api.getTracking(id).then(t => {
            if (t) {
                renderTracking(t.id);
            } else {
                $('tracking-list').innerHTML = '<div class="empty-state">Envío no encontrado</div>';
            }
        });
    }, 100);
}

function updateBadge() {
    const count = store.messages.filter(m => m.from === 'them').length;
    const el = $('chat-badge');
    if (el) el.textContent = count;
}

function showNewOrderModal() {
    const options = store.products.map(p => `<option value="${p.id}">${p.name} - ${formatMoney(p.price)}</option>`).join('');
    const content = $('modal-content');
    content.innerHTML = `
        <div class="modal-header">
            <h3>Nueva Orden</h3>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>Producto</label>
                <select id="order-product">${options}</select>
            </div>
            <div class="form-group">
                <label>Cantidad</label>
                <input type="number" id="order-qty" value="1" min="1">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
            <button class="btn-primary" onclick="submitNewOrder()">Crear Orden</button>
        </div>
    `;
    $('modal-overlay').classList.remove('hidden');
}

function closeModal() {
    $('modal-overlay').classList.add('hidden');
}

async function submitNewOrder() {
    const id = Number($('order-product').value);
    const qty = Number($('order-qty').value);
    try {
        const order = await api.createOrder(id, qty);
        closeModal();
        alert(`Pedido #${order.id} creado. Total: ${formatMoney(order.total)}`);
        showSection('orders');
        renderOrders();
        renderDashboard();
    } catch (e) {
        alert(e.message);
    }
}

/* ---------- Init ---------- */
async function init() {
    const loading = $('loading-screen');
    const main = $('main-interface');
    const socketText = $('socket-text');

    setStatus('socket-text', 'Iniciando simulación...');
    setPulse('');

    await api.init();

    setStatus('socket-text', 'Simulación lista');
    setPulse('simulated');

    setTimeout(() => {
        setStatus('socket-text', 'En línea');
        setPulse('online');
    }, 800);

    loading.classList.add('hidden');
    main.classList.add('visible');

    showSection('dashboard');
    updateBadge();
}

// Close modal on overlay click
$('modal-overlay').addEventListener('click', (e) => {
    if (e.target === $('modal-overlay')) closeModal();
});

init();
